import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForToken, saveConnection } from "@/lib/oauth";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    const desc = searchParams.get("error_description") || error;
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(desc)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_callback", req.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(`oauth_state_${providerId}`)?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=state_mismatch", req.url)
    );
  }

  const codeVerifier = cookieStore.get(`oauth_verifier_${providerId}`)?.value;
  cookieStore.delete(`oauth_state_${providerId}`);
  cookieStore.delete(`oauth_verifier_${providerId}`);

  try {
    const tokenData = await exchangeCodeForToken(providerId, code, codeVerifier);

    let providerAccountId: string | undefined;
    let metadata: Record<string, unknown> = {};

    try {
      ({ providerAccountId, metadata } = await fetchProviderProfile(
        providerId,
        tokenData.access_token
      ));
    } catch {
      // Non-fatal
    }

    await saveConnection(
      session.user.id,
      providerId,
      tokenData,
      providerAccountId,
      metadata
    );

    return NextResponse.redirect(
      new URL(`/dashboard?success=${encodeURIComponent(`${providerId} connected successfully!`)}`, req.url)
    );
  } catch (err) {
    console.error(`OAuth callback error for ${providerId}:`, err);
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}

async function fetchProviderProfile(
  providerId: string,
  accessToken: string
): Promise<{ providerAccountId?: string; metadata: Record<string, unknown> }> {
  const profileEndpoints: Record<
    string,
    { url: string; getId: (data: Record<string, unknown>) => string; getMeta: (data: Record<string, unknown>) => Record<string, unknown> }
  > = {
    google: {
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
      getId: (d) => d.id as string,
      getMeta: (d) => ({ email: d.email, name: d.name, picture: d.picture }),
    },
    github: {
      url: "https://api.github.com/user",
      getId: (d) => String(d.id),
      getMeta: (d) => ({ login: d.login, name: d.name, avatar_url: d.avatar_url }),
    },
    discord: {
      url: "https://discord.com/api/users/@me",
      getId: (d) => d.id as string,
      getMeta: (d) => ({ username: d.username, discriminator: d.discriminator }),
    },
    linkedin: {
      url: "https://api.linkedin.com/v2/me",
      getId: (d) => d.id as string,
      getMeta: (d) => ({ localizedFirstName: d.localizedFirstName, localizedLastName: d.localizedLastName }),
    },
    twitter: {
      url: "https://api.twitter.com/2/users/me",
      getId: (d) => (d.data as Record<string, unknown>)?.id as string,
      getMeta: (d) => {
        const user = d.data as Record<string, unknown>;
        return { username: user?.username, name: user?.name };
      },
    },
  };

  const ep = profileEndpoints[providerId];
  if (!ep) return { metadata: {} };

  const res = await fetch(ep.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return { metadata: {} };
  const data = await res.json();
  return {
    providerAccountId: ep.getId(data),
    metadata: ep.getMeta(data),
  };
}
