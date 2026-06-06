import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAuthUrl, generateState, generateCodeVerifier } from "@/lib/oauth";
import { getProvider } from "@/lib/providers";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const clientId = process.env[`${providerId.toUpperCase()}_CLIENT_ID`];
  if (!clientId) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: `${provider.name} credentials not configured. Add ${providerId.toUpperCase()}_CLIENT_ID and ${providerId.toUpperCase()}_CLIENT_SECRET to your .env file.`,
      },
      { status: 400 }
    );
  }

  const state = generateState();
  const cookieStore = await cookies();

  cookieStore.set(`oauth_state_${providerId}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  let codeVerifier: string | undefined;
  if (provider.usePKCE) {
    codeVerifier = generateCodeVerifier();
    cookieStore.set(`oauth_verifier_${providerId}`, codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  const authUrl = buildAuthUrl(providerId, state, codeVerifier);
  return NextResponse.redirect(authUrl);
}
