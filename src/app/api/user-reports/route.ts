import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserWithUsername } from "@/lib/require-user";

const schema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(200).optional().default(""),
});

export async function POST(req: Request) {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const reporterId = authResult.user.id;
  const reportedUserId = parsed.data.userId;

  if (reporterId === reportedUserId) {
    return NextResponse.json({ error: "cannot_report_self" }, { status: 403 });
  }

  const reportedUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true },
  });

  if (!reportedUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  try {
    await prisma.userReport.create({
      data: {
        reporterId,
        reportedUserId,
        reason: parsed.data.reason || null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ error: "already_reported" }, { status: 409 });
    }

    throw err;
  }

  return NextResponse.json({ ok: true });
}