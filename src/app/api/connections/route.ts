import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.oAuthConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      scopes: true,
      metadata: true,
      status: true,
      tokenExpiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ connections });
}
