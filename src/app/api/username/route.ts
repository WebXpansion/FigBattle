import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Règles du pseudo : 3–20 caractères, lettres/chiffres/tiret/underscore.
const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "too_short")
    .max(20, "too_long")
    .regex(/^[a-zA-Z0-9_-]+$/, "invalid_chars"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.message ?? "invalid";
    return NextResponse.json({ error: code }, { status: 400 });
  }

  const { username } = parsed.data;

  // Vérifie l'unicité (insensible à la casse) hors de son propre compte.
  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      NOT: { id: session.user.id },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "taken" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username },
  });

  return NextResponse.json({ ok: true, username });
}