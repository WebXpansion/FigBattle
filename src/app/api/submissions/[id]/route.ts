import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { requireUserWithUsername } from "@/lib/require-user";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "submissions";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

function getStoragePathFromImageUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const index = url.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;

  const userId = authResult.user.id;
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      score: true,
      imageUrl: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (submission.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.deleteMany({
      where: { submissionId: submission.id },
    });

    await tx.vote.deleteMany({
      where: { submissionId: submission.id },
    });

    await tx.submission.delete({
      where: { id: submission.id },
    });

    await tx.$executeRaw`
      UPDATE "User"
      SET score = GREATEST(0, score - ${submission.score})
      WHERE id = ${userId}
    `;
  });

  const supabase = getSupabaseAdmin();
  const storagePath = getStoragePathFromImageUrl(submission.imageUrl);

  if (supabase && storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }

  return NextResponse.json({ ok: true });
}