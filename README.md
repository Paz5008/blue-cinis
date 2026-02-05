# Blue Cinis

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Fonctionnalités

Loire Gallery offre une expérience complète pour les artistes et collectionneurs d'art.

### 🎨 CMS Block-Based

Créez des pages uniques avec notre éditeur visuel intuitif :

- **Glisser-déposer** : Construisez votre page en ajoutant des blocs (texte, images, galeries, vidéos)
- **Positionnement libre** : Mode "Antigravity" pour des compositions créatives sans grille
- **Thèmes personnalisés** : Couleurs, polices et arrière-plans à votre image
- **Prévisualisation temps réel** : Voyez le résultat final avant de publier

### 🔔 Alertes Personnalisées

Ne manquez jamais une œuvre qui vous correspond :

- **Critères multiples** : Artistes, catégories, styles, techniques
- **Fourchette de prix** : Définissez votre budget
- **Notifications flexibles** : Email ou push, immédiat ou résumé quotidien/hebdomadaire

### 🔍 Découverte d'Œuvres

Explorez la galerie selon vos envies :

- **Filtres avancés** : Par catégorie, technique, couleur, dimension
- **Recommandations intelligentes** : Suggestions basées sur vos goûts
- **Deep Zoom** : Observez chaque détail dans une qualité exceptionnelle

### 📱 View In Room (AR)

Visualisez les œuvres chez vous avant d'acheter :

- **Réalité augmentée** : Placez l'œuvre sur votre mur via votre smartphone
- **Compatible iOS & Android** : Fonctionne sur les appareils récents
- **Dimensions réelles** : L'œuvre s'affiche à sa taille réelle

## Getting Started

### Configuration
Copiez `.env.example` en `.env` (ou `.env.local`) et remplissez les valeurs. Exemple minimal:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=shadow_prisma"
NEXTAUTH_URL="https://blue-cinis.com"
NEXTAUTH_SECRET="<un_secret_long_et_aleatoire>"

# SMTP (optionnel en dev)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SALES_EMAIL=

# reCAPTCHA (optionnel)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# Stripe (optionnel en dev)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PM_TYPES=
STRIPE_ENABLE_TAX=false

# Réservations (garder la même valeur côté client/serveur)
RESERVATION_TTL_MIN=15
NEXT_PUBLIC_RESERVATION_TTL_MIN=15

# Domaine (prod)
DOMAIN=
```

Les variables d’environnement sont validées via `src/env.ts` (Zod). En production, certaines variables sont obligatoires (NEXTAUTH_SECRET, DATABASE_URL, DOMAIN ou NEXTAUTH_URL). Pour Prisma Migrate, fournissez également `SHADOW_DATABASE_URL` : vous pouvez réutiliser la même instance Postgres mais cibler un schéma dédié (`?schema=shadow_prisma`) afin d’éviter le droit `CREATEDB`.

### Migrations & Seed
Apply migrations and seed the database:

```bash
# utilise scripts/prisma-shadow pour dériver SHADOW_DATABASE_URL automatiquement
npm run db:dev -- --name init
npm run seed # crée des données de démo (utilise SEED_ARTIST_EMAIL/PASSWORD si fournis)
# Si vous activez Stripe/Upstash, renseignez les clés correspondantes (voir DEPLOY.md)
```
> Astuce : `npm run db:dev -- <args Prisma>` est un alias de `node scripts/prisma-shadow.js <args>`. Si vous souhaitez appeler Prisma manuellement, utilisez plutôt `node scripts/prisma-shadow.js migrate dev`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Vous pouvez démarrer en éditant `app/page.tsx`. La page se met à jour automatiquement.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tests

- `npm run typecheck` assure que Next/Prisma compilent sans erreurs TypeScript (bloquant en CI).
- Exécution rapide (critique):
  - `npm run test:critical` exécute les tests unitaires critiques des webhooks paiements.
- Suite complète (à étendre progressivement):
  - `npm test` lance Vitest (non bloquant pour l’instant).
- Alias @ pour Vitest: renommez `vitest.config.example.ts` en `vitest.config.mts` (ou adaptez le fichier existant) et assurez-vous que `vite` est installé via `npm ci`. Cela activera les alias `@`, `@/components`, `@/context`, `@/types` dans les tests.

## Thème & mode sombre

Le système de thème (clair/sombre) est documenté dans [`docs/theming.md`](./docs/theming.md). Vous y trouverez :

- Architecture côté serveur et client (`app/layout.tsx`, `context/ThemeContext.tsx`).
- Liste des tokens (`app/globals.css`, `styles/tokens.ts`).
- Checklist QA manuelle et scénarios Playwright pour valider la persistance du mode sombre.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Déploiement

Consultez DEPLOY.md pour une procédure détaillée (variables d’environnement, DB, emails SMTP, sitemap/robots).
