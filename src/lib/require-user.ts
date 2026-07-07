import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RequiredUser = {
  id: string;
  username: string;
};

export async function requireUserWithUsername(): Promise<
  | { user: RequiredUser; response?: never }
  | { user?: never; response: NextResponse }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  if (!user.username) {
    return {
      response: NextResponse.json(
        { error: "username_required" },
        { status: 428 }
      ),
    };
  }

  return {
    user: {
      id: user.id,
      username: user.username,
    },
  };
}