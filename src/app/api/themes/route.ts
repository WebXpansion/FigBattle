import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserWithUsername } from "@/lib/require-user";

// GET /api/themes — liste légère des thèmes actifs (pour le carrousel visuel).
export async function GET() {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;
  const themes = await prisma.theme.findMany({
    where: { active: true },
    select: { id: true, labelFr: true, labelEn: true, category: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ themes });
}