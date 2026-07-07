import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

const schema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["ignore", "delete_account"]),
});

function getStoragePathFromImageUrl(imageUrl: string): string | null {
  try {
    const marker = `/${STORAGE_BUCKET}/`;
    const index = imageUrl.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(imageUrl.substring(index + marker.length));
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { reportId, action } = parsed.data;

  const report = await prisma.userReport.findUnique({
    where: { id: reportId },
    include: {
      reportedUser: {
        select: {
          id: true,
          submissions: {
            select: {
              id: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (action === "ignore") {
    await prisma.userReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ ok: true });
  }

  const userId = report.reportedUser.id;
  const storagePaths = report.reportedUser.submissions
    .map((submission) => getStoragePathFromImageUrl(submission.imageUrl))
    .filter((path): path is string => Boolean(path));

  await prisma.$transaction(async (tx) => {
    const votesCast = await tx.vote.findMany({
      where: { voterId: userId },
      select: {
        id: true,
        value: true,
        submissionId: true,
        submission: {
          select: {
            userId: true,
          },
        },
      },
    });

    for (const vote of votesCast) {
      await tx.submission.update({
        where: { id: vote.submissionId },
        data: {
          score: { decrement: vote.value },
          voteCount: { decrement: 1 },
        },
      });

      await tx.user.update({
        where: { id: vote.submission.userId },
        data: {
          score: { decrement: vote.value },
        },
      });
    }

    await tx.user.delete({
      where: { id: userId },
    });
  });

  if (storagePaths.length > 0) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove(storagePaths);
  }

  return NextResponse.json({ ok: true });
}