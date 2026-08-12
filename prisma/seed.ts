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
      labelFr: "Site Formule 2",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/concept-F1/f1-concept-car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/concept-F1/F1.webp",
    },
    {
      labelFr: "Site Formule 2",
      labelEn: "Formula 1 website",
      difficulty: "HARD",
      category: "AUTOMOTIVE",
      durationSec: 900,
      glbUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/concept-F1/f1-concept-car.glb",
      glbPreviewUrl: "https://pknrhxcnipjajdrkblhs.supabase.co/storage/v1/object/public/theme-assets/concept-F1/F1.webp",
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