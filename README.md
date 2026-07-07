# FigBattle

Jeu de design de maquettes en multijoueur, inspiré d'Editing Battle.
On conçoit une maquette sous chrono, la communauté vote, on grimpe au classement.

> `figbattle` est un nom de travail. Pour le renommer : rechercher/remplacer
> `figbattle` et `FigBattle` dans tout le repo.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Auth.js v5 — connexion Google et Discord** (pseudo + avatar récupérés automatiquement)
- **Prisma** + **PostgreSQL** (Supabase)
- **Supabase Storage** — upload des images de maquettes (URLs signées)
- **next-intl** — bilingue **FR / EN**

## Fonctionnalités

| Page | Rôle |
|------|------|
| `/` | Accueil + « comment ça marche » |
| `/play` | Jeu solo : tirage de thème aléatoire, chrono 10 min, upload. Dépassement → « rien soumis » |
| `/feed` | Vote sur les maquettes des autres (Moyen 0,5 / Bien 1 / Excellent 2). La carte votée disparaît |
| `/leaderboard` | Podium or/argent/bronze, classement, ton rang |
| `/profile/[id]` | Pseudo, score, rang, tous les rendus envoyés |

Le score est **dénormalisé** sur `User` et `Submission` pour un classement
rapide à grande échelle. Le vote est **transactionnel** et un `@@unique`
empêche le double vote.

## Installation

```bash
npm install
cp .env.example .env       # puis remplis les valeurs
npx prisma generate
npm run db:push            # crée les tables sur Supabase
npm run db:seed            # insère les thèmes de départ
npm run dev
```

### Configuration requise

1. **Supabase** : crée un projet. Récupère `DATABASE_URL` / `DIRECT_URL`
   (Settings → Database) et les clés API (Settings → API).
   Crée un bucket Storage nommé `submissions` (public en lecture).
2. **Discord** : [Developer Portal](https://discord.com/developers/applications)
   → New Application → OAuth2. Copie le Client ID/Secret. Ajoute le redirect
   `http://localhost:3000/api/auth/callback/discord` (et l'URL de prod).
3. **AUTH_SECRET** : `npx auth secret`

## Architecture

```
src/
  app/
    [locale]/            pages localisées (fr/en)
      page.tsx           accueil
      play/              jeu solo
      feed/              vote
      leaderboard/       classement
      profile/[id]/      profil public
    api/
      auth/[...nextauth] Auth.js
      themes/            tirage aléatoire
      submissions/       URL d'upload signée + feed + création
      votes/             vote transactionnel
  components/            Nav, Providers
  lib/                   prisma, auth, supabase, i18n, routing, barème de vote
  messages/              fr.json, en.json
prisma/
  schema.prisma          modèles
  seed.ts                thèmes de maquettes
```

## Sécurité (en place)

- Toutes les routes API vérifient la session.
- **Chrono côté serveur** : une `Round` enregistre `startedAt`. La soumission
  est refusée si `now - startedAt > durationSec`, quoi que dise le client.
  Au refresh, la manche active est récupérée et le chrono reprend exactement.
- **Rate limiting** (Upstash) sur votes, soumissions, lancements de manche,
  inscriptions. Désactivé proprement si Upstash non configuré (dev).
- **Upload contraint** : extension (png/jpg/webp) et présence du fichier
  vérifiées serveur ; taille max 5 Mo (client + bucket).
- Vote unique par contrainte DB, pas de vote sur soi-même.
Validation zod partout.
- La service role key Supabase reste serveur uniquement.

## Reste à faire pour la prod


- Filtre **mensuel** du classement (global en place).
- **Modération** des images (signalement / filtre).
- Multijoueur temps réel (rooms).
- Pages légales (mentions, confidentialité, CGU).
- Limite de taille d'upload imposée au niveau du bucket Supabase
  (Storage → Policies) en complément de la vérification applicative.
