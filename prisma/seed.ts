import { PrismaClient, Difficulty, ThemeCategory } from "@prisma/client";

const prisma = new PrismaClient();

const themes: {
  labelFr: string;
  labelEn: string;
  difficulty: Difficulty;
  category: ThemeCategory;
  durationSec: number;
}[] = [
  // ECOMMERCE
  { labelFr: "Boutique de sneakers", labelEn: "Sneaker store", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Page produit d'une montre connectée", labelEn: "Smartwatch product page", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Boutique de café", labelEn: "Coffee shop store", difficulty: "EASY", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Site d'une marque de cosmétiques", labelEn: "Cosmetics brand website", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Boutique de vêtements", labelEn: "Clothing store", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Boutique de bijoux", labelEn: "Jewelry store", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Page produit d'un vélo électrique", labelEn: "E-bike product page", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Boutique de vin en ligne", labelEn: "Online wine shop", difficulty: "EASY", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Site d'une marque de lunettes", labelEn: "Eyewear brand website", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Site d'une marque de montres de luxe", labelEn: "Luxury watch brand website", difficulty: "HARD", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Page produit d'une enceinte connectée", labelEn: "Smart speaker product page", difficulty: "MEDIUM", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Boutique de skateboards", labelEn: "Skateboard store", difficulty: "EASY", category: "ECOMMERCE", durationSec: 900 },
  { labelFr: "Site d'un fleuriste", labelEn: "Florist website", difficulty: "EASY", category: "ECOMMERCE", durationSec: 900 },

  // SAAS
  { labelFr: "Tableau de bord d'une app de finances", labelEn: "Finance app dashboard", difficulty: "HARD", category: "SAAS", durationSec: 900 },
  { labelFr: "Plateforme de cours en ligne", labelEn: "Online course platform", difficulty: "MEDIUM", category: "SAAS", durationSec: 900 },
  { labelFr: "Dashboard d'une app de sport", labelEn: "Fitness app dashboard", difficulty: "MEDIUM", category: "SAAS", durationSec: 900 },
  { labelFr: "Dashboard de statistiques réseaux sociaux", labelEn: "Social media analytics dashboard", difficulty: "HARD", category: "SAAS", durationSec: 900 },
  { labelFr: "Outil de réservation pour salons/coiffeurs", labelEn: "Salon booking tool", difficulty: "MEDIUM", category: "SAAS", durationSec: 900 },
  { labelFr: "Site d'un cabinet dentaire", labelEn: "Dental clinic website", difficulty: "EASY", category: "SAAS", durationSec: 900 },

  // PORTFOLIO
  { labelFr: "Portfolio d'un photographe de mariage", labelEn: "Wedding photographer portfolio", difficulty: "EASY", category: "PORTFOLIO", durationSec: 900 },
  { labelFr: "Site d'un tatoueur", labelEn: "Tattoo artist website", difficulty: "MEDIUM", category: "PORTFOLIO", durationSec: 900 },
  { labelFr: "Portfolio d'un architecte", labelEn: "Architect portfolio", difficulty: "MEDIUM", category: "PORTFOLIO", durationSec: 900 },
  { labelFr: "Site d'un DJ / producteur de musique", labelEn: "DJ / music producer website", difficulty: "MEDIUM", category: "PORTFOLIO", durationSec: 900 },
  { labelFr: "Portfolio d'un designer 3D", labelEn: "3D designer portfolio", difficulty: "HARD", category: "PORTFOLIO", durationSec: 900 },
  { labelFr: "Site d'une agence de pub", labelEn: "Advertising agency website", difficulty: "MEDIUM", category: "PORTFOLIO", durationSec: 900 },

  // BLOG
  { labelFr: "Blog cuisine", labelEn: "Cooking blog", difficulty: "EASY", category: "BLOG", durationSec: 900 },
  { labelFr: "Blog crypto / finance", labelEn: "Crypto / finance blog", difficulty: "MEDIUM", category: "BLOG", durationSec: 900 },

  // MOBILE
  { labelFr: "App de rencontres", labelEn: "Dating app", difficulty: "MEDIUM", category: "MOBILE", durationSec: 900 },
  { labelFr: "App météo", labelEn: "Weather app", difficulty: "EASY", category: "MOBILE", durationSec: 900 },
  { labelFr: "App de covoiturage", labelEn: "Ridesharing app", difficulty: "HARD", category: "MOBILE", durationSec: 900 },
  { labelFr: "App de recettes de cuisine", labelEn: "Recipe app", difficulty: "EASY", category: "MOBILE", durationSec: 900 },
  { labelFr: "App de gestion de budget", labelEn: "Budgeting app", difficulty: "MEDIUM", category: "MOBILE", durationSec: 900 },

  // FOOD
  { labelFr: "Site d'un restaurant gastronomique", labelEn: "Fine dining restaurant website", difficulty: "MEDIUM", category: "FOOD", durationSec: 900 },
  { labelFr: "Site d'une pizzeria", labelEn: "Pizzeria website", difficulty: "EASY", category: "FOOD", durationSec: 900 },
  { labelFr: "Site d'un bar à cocktails", labelEn: "Cocktail bar website", difficulty: "MEDIUM", category: "FOOD", durationSec: 900 },
  { labelFr: "Site d'un restaurant japonais / sushi", labelEn: "Japanese / sushi restaurant website", difficulty: "MEDIUM", category: "FOOD", durationSec: 900 },
  { labelFr: "Page d'une marque de bière", labelEn: "Beer brand page", difficulty: "EASY", category: "FOOD", durationSec: 900 },

  // ENTERTAINMENT
  { labelFr: "Site de réservation de cinéma", labelEn: "Cinema booking website", difficulty: "MEDIUM", category: "ENTERTAINMENT", durationSec: 900 },
  { labelFr: "Plateforme de streaming vidéo (type Netflix)", labelEn: "Video streaming platform (Netflix-style)", difficulty: "HARD", category: "ENTERTAINMENT", durationSec: 900 },
  { labelFr: "Site d'un parc d'attractions", labelEn: "Theme park website", difficulty: "MEDIUM", category: "ENTERTAINMENT", durationSec: 900 },
  { labelFr: "Plateforme de tournoi e-sport", labelEn: "Esports tournament platform", difficulty: "HARD", category: "ENTERTAINMENT", durationSec: 900 },
  { labelFr: "Plateforme de paris sportifs", labelEn: "Sports betting platform", difficulty: "HARD", category: "ENTERTAINMENT", durationSec: 900 },

  // TRAVEL
  { labelFr: "Site de réservation d'hôtel", labelEn: "Hotel booking website", difficulty: "MEDIUM", category: "TRAVEL", durationSec: 900 },
  { labelFr: "Site de location de voitures", labelEn: "Car rental website", difficulty: "MEDIUM", category: "TRAVEL", durationSec: 900 },

  // AUTOMOTIVE
  { labelFr: "Page d'une voiture électrique (type Tesla)", labelEn: "Electric car page (Tesla-style)", difficulty: "HARD", category: "AUTOMOTIVE", durationSec: 900 },
  { labelFr: "Site d'une marque de drones", labelEn: "Drone brand website", difficulty: "MEDIUM", category: "AUTOMOTIVE", durationSec: 900 },
  { labelFr: "Configurateur de voiture", labelEn: "Car configurator", difficulty: "HARD", category: "AUTOMOTIVE", durationSec: 900 },
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