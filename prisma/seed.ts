import { PrismaClient, Difficulty, ThemeCategory } from "@prisma/client";

const prisma = new PrismaClient();

const themes: {
  labelFr: string;
  labelEn: string;
  difficulty: Difficulty;
  category: ThemeCategory;
  durationSec: number;
  glbUrl?: string;
  glbPreviewUrl?: string;
}[] = [
  // ECOMMERCE
  { labelFr: "Boutique de sneakers", labelEn: "Sneaker store", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  

    // MESHY
    {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    }, // MESHY
    {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    },
     // MESHY
     {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    },
     // MESHY
     {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    },
     // MESHY
     {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    },
    
     // MESHY
     {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    },
     // MESHY
     {
      labelFr: "Site Formule 1",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/bwt_alpine_f1_concept_car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/f1-concept/formule1.webp",
    },

];

async function main() {
  console.log("Seed des thèmes…");

  // Désactive d'abord tout : les thèmes retirés de la liste disparaîtront
  // du tirage (sans être supprimés, pour préserver l'historique des manches).
  await prisma.theme.updateMany({ data: { active: false } });

  for (const t of themes) {
    await prisma.theme.upsert({
      where: { id: t.labelFr },
      update: { ...t, active: true },   // applique TOUS les champs, pas que la catégorie
      create: { id: t.labelFr, ...t, active: true },
    });
  }
  console.log(`${themes.length} thèmes actifs en base.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());