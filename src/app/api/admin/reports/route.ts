import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import { sendRemovalEmail } from "@/lib/email";

// GET /api/admin/reports — liste les maquettes signalées (pour le panneau admin).
// GET /api/admin/reports — liste les maquettes signalées + profils signalés.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const submissions = await prisma.submission.findMany({
    where: { reportCount: { gt: 0 } },
    orderBy: { reportCount: "desc" },
    include: {
      theme: { select: { labelFr: true, labelEn: true } },
      user: { select: { id: true, username: true, name: true, email: true } },
    },
  });

  const userReports = await prisma.userReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      reportedUser: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          score: true,
        },
      },
    },
  });

  return NextResponse.json({
    submissions,
    userReports,
  });
}

// PATCH /api/admin/reports — action admin : "restore" ou "delete".
const schema = z.object({
  submissionId: z.string().min(1),
  action: z.enum(["restore", "delete"]),
  locale: z.string().default("fr"),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { submissionId, action, locale } = parsed.data;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      theme: { select: { labelFr: true, labelEn: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (action === "restore") {
    // Rétablit : on démasque, on efface les signalements et on remet le compteur à 0.
    await prisma.$transaction([
      prisma.report.deleteMany({ where: { submissionId } }),
      prisma.submission.update({
        where: { id: submissionId },
        data: { hidden: false, reportCount: 0 },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // action === "delete"
  // 1) Retire les points gagnés par cette maquette du score du joueur.
  // 2) Supprime la maquette (les votes/reports partent en cascade).
  // 3) Supprime le fichier du bucket Storage.
  // 4) Email à l'auteur.
  const themeLabel = locale === "fr" ? submission.theme.labelFr : submission.theme.labelEn;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: submission.userId },
      data: { score: { decrement: submission.score } },
    }),
    prisma.submission.delete({ where: { id: submissionId } }),
  ]);

  // Supprime le fichier du bucket (on extrait le chemin depuis l'URL publique).
  try {
    const marker = `/${STORAGE_BUCKET}/`;
    const idx = submission.imageUrl.indexOf(marker);
    if (idx !== -1) {
      const path = submission.imageUrl.substring(idx + marker.length);
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);
    }
  } catch {
    // Échec de suppression du fichier non bloquant.
  }

  if (submission.user.email) {
    await sendRemovalEmail(
      submission.user.email,
      submission.user.name ?? "",
      themeLabel,
      locale
    );
  }

  return NextResponse.json({ ok: true });
}