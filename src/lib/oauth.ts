import { randomBytes, createHash } from "crypto";
import { getProvider } from "./providers";
import { encrypt, decrypt } from "./crypto";
import { prisma } from "./prisma";

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthUrl(
  providerId: string,
  state: string,
  codeVerifier?: string
): string {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const clientId = process.env[`${providerId.toUpperCase()}_CLIENT_ID`];
  if (!clientId) throw new Error(`Missing client ID for ${providerId}`);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/oauth/callback/${providerId}`;

  const params: Record<string, string> = {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: provider.scopes.join(provider.scopeSeparator),
    state,
    response_type: "code",
    ...provider.extraAuthParams,
  };

  if (provider.usePKCE && codeVerifier) {
    params.code_challenge = generateCodeChallenge(codeVerifier);
    params.code_challenge_method = "S256";
  }

  // Filter empty scope
  if (!params.scope) delete params.scope;

  return `${provider.authUrl}?${new URLSearchParams(params).toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  [key: string]: unknown;
}

export async function exchangeCodeForToken(
  providerId: string,
  code: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const clientId = process.env[`${providerId.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${providerId.toUpperCase()}_CLIENT_SECRET`];
  if (!clientId || !clientSecret)
    throw new Error(`Missing credentials for ${providerId}`);

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/oauth/callback/${providerId}`;

  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  };

  if (provider.usePKCE && codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  // Notion uses Basic auth
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (providerId === "notion") {
    headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    headers["Content-Type"] = "application/json";
    const res = await fetch(provider.tokenUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    });
    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
    return res.json();
  }

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { ...headers, Accept: "application/json" },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

export async function saveConnection(
  userId: string,
  providerId: string,
  tokenData: TokenResponse,
  providerAccountId?: string,
  metadata?: Record<string, unknown>
) {
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : undefined;

  const encrypted = encrypt(tokenData.access_token);
  const encryptedRefresh = tokenData.refresh_token
    ? encrypt(tokenData.refresh_token)
    : undefined;

  await prisma.oAuthConnection.upsert({
    where: {
      userId_provider_providerAccountId: {
        userId,
        provider: providerId,
        providerAccountId: providerAccountId || "default",
      },
    },
    update: {
      encryptedAccessToken: encrypted,
      encryptedRefreshToken: encryptedRefresh,
      tokenExpiresAt: expiresAt,
      scopes: tokenData.scope || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: "active",
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider: providerId,
      providerAccountId: providerAccountId || "default",
      encryptedAccessToken: encrypted,
      encryptedRefreshToken: encryptedRefresh,
      tokenExpiresAt: expiresAt,
      scopes: tokenData.scope || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: "active",
    },
  });
}

export async function getAccessToken(connectionId: string): Promise<string> {
  const conn = await prisma.oAuthConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  return decrypt(conn.encryptedAccessToken);
}

export async function refreshAccessToken(connectionId: string): Promise<void> {
  const conn = await prisma.oAuthConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  if (!conn.encryptedRefreshToken) throw new Error("No refresh token stored");

  const provider = getProvider(conn.provider);
  if (!provider) throw new Error("Unknown provider");

  const clientId = process.env[`${conn.provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${conn.provider.toUpperCase()}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) throw new Error("Missing credentials");

  const refreshToken = decrypt(conn.encryptedRefreshToken);
  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) throw new Error("Token refresh failed");
  const data: TokenResponse = await res.json();

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : undefined;

  await prisma.oAuthConnection.update({
    where: { id: connectionId },
    data: {
      encryptedAccessToken: encrypt(data.access_token),
      encryptedRefreshToken: data.refresh_token
        ? encrypt(data.refresh_token)
        : conn.encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    },
  });
}
