import { PrismaClient, Difficulty, ThemeCategory } from "@prisma/client";

const prisma = new PrismaClient();

const themes: {
  labelFr: string;
  labelEn: string;
  difficulty: Difficulty;
  category: ThemeCategory;
  durationSec: number;
}[] = [
  { labelFr: "Boutique e-commerce de chaussures", labelEn: "Shoe e-commerce store", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 600 },
  { labelFr: "Page produit d'un casque audio", labelEn: "Headphones product page", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 600 },
  { labelFr: "Boutique de plantes en ligne", labelEn: "Online plant shop", difficulty: "EASY", category: "ECOMMERCE", durationSec: 600 },
  { labelFr: "Tableau de bord SaaS analytics", labelEn: "SaaS analytics dashboard", difficulty: "HARD", category: "SAAS", durationSec: 600 },
  { labelFr: "Page de pricing d'un outil B2B", labelEn: "B2B tool pricing page", difficulty: "MEDIUM", category: "SAAS", durationSec: 600 },
  { labelFr: "Landing page d'une app de gestion", labelEn: "Management app landing page", difficulty: "MEDIUM", category: "SAAS", durationSec: 600 },
  { labelFr: "Portfolio d'un photographe", labelEn: "Photographer portfolio", difficulty: "EASY", category: "PORTFOLIO", durationSec: 600 },
  { labelFr: "Page d'accueil d'un studio de design", labelEn: "Design studio homepage", difficulty: "MEDIUM", category: "PORTFOLIO", durationSec: 600 },
  { labelFr: "Blog éditorial de mode", labelEn: "Fashion editorial blog", difficulty: "EASY", category: "BLOG", durationSec: 600 },
  { labelFr: "Magazine en ligne de voyage", labelEn: "Online travel magazine", difficulty: "MEDIUM", category: "BLOG", durationSec: 600 },
  { labelFr: "App mobile de banque (écran d'accueil)", labelEn: "Mobile banking app home screen", difficulty: "HARD", category: "MOBILE", durationSec: 600 },
  { labelFr: "App mobile de méditation", labelEn: "Meditation mobile app", difficulty: "EASY", category: "MOBILE", durationSec: 600 },
];

async function main() {
  console.log("Seed des thèmes…");
  for (const t of themes) {
    await prisma.theme.upsert({
      where: { id: t.labelFr },
      update: { category: t.category },
      create: { id: t.labelFr, ...t },
    });
  }
  console.log(`${themes.length} thèmes en base.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());