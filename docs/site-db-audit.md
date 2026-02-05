# Audit technique – site, base et shadow DB (février 2025)

## Résumé
- **Front / APIs** : Next.js 15.2 (App Router) avec authentification NextAuth, i18n (`app/layout.tsx`, `app/ClientProviders.tsx`), contextes client (thème, sélection, toasts) et middleware CSP renforcer (`middleware.ts`). Les pages artistes rendues dynamiquement consomment Prisma directement (`app/artistes/[handle]/page.tsx`).
- **Back-end** : Prisma 6.6 sur PostgreSQL. Le schéma `prisma/schema.prisma` contient les notions d’utilisateurs, artistes, œuvres, variantes, réservations, leads, commandes, notifications et métriques CTA. La version cible (`prisma/schema.v2.prisma`) introduit enums et slugs obligatoires ; la feuille de route est décrite dans `docs/db/migration-plan.md`.
- **Shadow DB / DX** : `scripts/prisma-shadow.js` dérive automatiquement `SHADOW_DATABASE_URL` à partir de `DIRECT_URL`/`DATABASE_URL`. `docker-compose.yml` expose Postgres sur `5433`, et `scripts/db-diag.sh` diagnostique/peuple les URLs. Aucun `dev.db` SQLite utilisable (fichier vide).
- **Qualité** : la porte CI repose sur `npm run lint`, `npm run typecheck` (bloquant) et `npm run test:critical`. Vite signale la dépréciation du build CJS. Playwright (`e2e/*.spec.ts`) et scripts santé (`scripts/health-check.js`, `/api/health`) complètent la couverture.

---

## 1. État du site Next.js

### 1.1 Architecture
- **App Router** : `app/layout.tsx` orchestre le thème, i18n (`I18nProvider`) et les scripts tiers (reCAPTCHA, Plausible, Umami). Il injecte `ClientProviders` (NextAuth `SessionProvider`, `ThemeProvider`, `CartProvider`, `ToastProvider`) pour tout le rendu client.
- **Pages clés** :
  - `app/page.tsx` : home « v2 » modulée en sections `components/home/*` avec usage massif de `Suspense`.
  - `app/admin/*` : hub admin (leads, commandes, artistes, œuvres) avec UI cards (ex. `app/admin/page.tsx`).
  - `app/artistes/[handle]/page.tsx` et `app/artistes/by-id/[id]/page.tsx` : rendu server-side avancé, gestion des slugs/id, fallback vers `ArtistPage` + `ArtistPublicProfile`.
  - `app/contact`, `app/galerie`, `/e2e/*` démontrent les différents funnels.
- **Composants/contexts** :
  - `context/ThemeContext.tsx`, `context/CartContext.tsx`, `context/ToastContext.tsx`.
  - `components/dashboard/*` : builder CMS avec notifications, Stripe, formulaires shipping.
  - Navbar/hero dépendants du thème (`components/navbar/*`, `styles/tokens.ts`, `docs/theming.md`).
- **Middleware & sécurité** : `middleware.ts` génère `x-request-id`, `x-csp-nonce` et CSP dynamiques (gestion reCAPTCHA, Stripe, analytics). `src/lib/logger.ts` fournit un logger Pino redactionné.
- **Internationalisation** : messages FR/EN (`/i18n/messages/*.json`) chargés côté serveur via cookies `locale`.

### 1.2 APIs & services
- **Surface API** : `app/api/*` couvre l’authentification (`auth/[...nextauth]`), inscriptions (`artist-registration`, `client-registration`), catalogue (`artworks`, `categories`, `events`), e-commerce (`checkout`, `orders`, `payments/webhook`, `stripe/*`), médias (`uploads`, `media`), notifications (`artist/notifications`), analytics (`banner/cta`), santé (`health`, `db/ping`), debug (`debug/email`), revalidate/sitemap, etc.
- **Ratelimit & sécurité** : `src/lib/ratelimit.ts` charge Upstash de façon paresseuse, fallback in-memory pour les CTA `app/api/banner/cta/route.ts`. `app/api/health/route.ts` vérifie colonnes critiques (`Artist.stripeAccountId`, `Artwork.reservedUntil`, table `Order`) et les intégrations (Stripe, SMTP, domaines).
- **Paiement Stripe** : `src/lib/payments/webhooks.ts` gère `checkout.session.completed`, idempotence via `WebhookEvent`, décrémente stock/réservations en transaction et notifie via `src/lib/mailer.ts`. Suite de tests critiques `test/api.payments.webhook.test.ts`.
- **Scripts santé / diag** : `scripts/health-check.js` frappe routes clés, `scripts/diagnose.ts` check DB/Cloudinary/Stripe.

### 1.3 Qualité & couverture
- `npm run lint` : OK, deux avertissements « Unused eslint-disable » (`app/admin/leads/page.tsx:72`, `app/admin/orders/page.tsx:89`). À nettoyer pour un build strict.
- `npm run typecheck` : Obligatoire avant merge (`tsc --noEmit`), il couvre les routes App et les Prisma types.
- `npm run test:critical` : OK (3 tests, `test/api.payments.webhook.test.ts`). Warning Vite CJS déprécié (à migrer vers ESM API lors de la prochaine montée de version).
- **Tests complémentaires** : `npm test` (Vitest) et Playwright (`e2e/*.spec.ts`) couvrent authent, nav mobile, thème, bannières, admin, etc. `docs/theming.md` et `docs/cms-navigation.md` listent les checklists QA.
- **Points de vigilance** :
  - Quelques vues secondaires (galerie/blog/dashboard) conservent `// @ts-nocheck`; les pages artistes ont été nettoyées, il reste à étendre le typage aux autres modules.
  - Les endpoints servent des fallbacks statiques si la DB tombe (`src/lib/data/artworks.ts`, `src/lib/data/categories.ts`), ce qui masque parfois des erreurs réelles ; surveiller les logs.
  - Les intégrations optionnelles (Stripe, SMTP, Upstash) doivent être configurées avant un déploiement prod, sinon `/api/health` retournera des `issues`.

---

## 2. Base principale (Prisma/PostgreSQL)

### 2.1 Schéma actuel (`prisma/schema.prisma`)
- **Identité & personnalisation** : `User`, `ProfileCustomization`, `ArtistPage` (multi-pages avec brouillon/publication).
- **Catalogue** : `Artist` (commerce/toggles + notifications JSON), `Artwork` (stock, réservations souples, catégories), `Category`, `Event`, `BlogPost`.
- **E-commerce** : `Variant`, `Reservation`, `Order` (statuts string), `Lead`, `BannerCtaMetric`, `WebhookEvent`, `AdminAuditLog`.
- **Limitations actuelles** : statuts string (pas d’enum) ⇒ peu de validation côté DB; certains champs (slug, currency) optionnels d’après v1.

### 2.2 Schéma cible (`prisma/schema.v2.prisma` + `docs/db/migration-plan.md`)
- Enums pour `Role`, `ReservationStatus`, `OrderStatus`, `FulfillmentStatus`, `PublishStatus`.
- Slugs obligatoires pour `Artist`, `Artwork`, `Category`, `BlogPost`; `Artwork.currency` explicite (`@default("EUR")`).
- Normalisation des paramètres e‑commerce (shipping, processing time) et ajout des métriques CTA.
- Approche recommandée : migrations non destructives + backfill (`scripts/migrate-to-v2.ts`, `scripts/backfill-artist-slugs.js`), puis cutover via `src/lib/repo/*`.

### 2.3 Migrations & scripts
- Historique `prisma/migrations/*` jusqu’à `20251028092741_20251026093000_add_banner_cta_metrics/` (nettoyage colonnes obsolètes, micro-ajustements TIMESTAMP).
- Scripts utilitaires :
  - `scripts/migrate-to-v2.ts` : backfill slugs/currencies pour artistes/œuvres/catégories/blog.
  - `scripts/migrate-legacy-to-artistpage.ts` : migration `ProfileCustomization` → `ArtistPage`.
  - `scripts/cleanup-reservations.ts` : tâche CRON pour purger réservations expirées.
  - `scripts/seed.js` (et `seed.ts`) : catégories, artistes démo, pages CMS, œuvres, events.
  - `scripts/create_test_artist.js`, `enrich_test_artist_profile.js`, `publish_test_artist_profile.js` pour générer des comptes de test rapidement.
- Le journal d’audit admin est désormais provisionné via la migration Prisma `prisma/migrations/20251112180000_add_admin_audit_log/`; exécuter `npm run db:deploy` (ou `prisma migrate deploy`) plutôt que de bricoler `docs/db/add_admin_audit_log.sql`.

### 2.4 Observations
- `prisma/dev.db` est vide → toute exécution Prisma attend un Postgres réel (local ou managé). Cela évite les divergences SQLite/Postgres.
- `src/lib/prisma.ts` ajoute un middleware de slug auto + mode `PRISMA_MOCK` (utile pour `next build` sans DB mais à utiliser uniquement hors prod).
- `app/api/health` interroge `information_schema` pour détecter les colonnes critiques, ce qui fait office de garde-fou basique.
- Pour les environnements sans Upstash, les limites (leads/auth) retombent sur des maps en mémoire (`app/api/banner/cta/route.ts`), acceptable en dev mais pas en multi-instance prod.

---

## 3. Shadow database & DX

- `prisma/schema.prisma` référence `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")`. Le script `scripts/prisma-shadow.js`:
  - charge `.env`,
  - dérive `SHADOW_DATABASE_URL` à partir de `SHADOW_DATABASE_URL || DIRECT_URL || DATABASE_URL`,
  - remplace `schema=public` par `schema=shadow_prisma` (ou la valeur `SHADOW_DATABASE_SCHEMA`),
  - lance `node_modules/.bin/prisma <args>`.
- Commandes existantes :
  - `npm run db:dev` ⇒ `node scripts/prisma-shadow.js migrate dev`.
  - `npm run db:deploy` ⇒ `prisma migrate deploy` (à lancer avec `DATABASE_URL` pointant vers la cible).
  - `npm run db:generate` ⇒ régénère le client.
  - `npm run db:up` / `db:down` ⇒ Postgres dockerisé (`docker-compose.yml`, port host 5433).
- `scripts/db-diag.sh` scanne Docker pour déduire `DATABASE_URL`/`DIRECT_URL` de la base locale, teste `psql` et fournit des suggestions à coller dans `.env`.
- `scripts/prisma-shadow.js` échoue si aucune URL n’est disponible → toujours définir au moins `DATABASE_URL` (même locale) avant `npm run db:dev`.
- CI/preview : possibilité d’activer `PRISMA_ACCELERATE_URL` (utilisé dans `src/lib/prisma.ts`) + `PRISMA_MOCK=1` pour les builds statiques qui n’ont pas besoin de DB.

---

## 4. Plan de remise au propre (site + DB + shadow)

### 4.1 Préparer l’environnement
1. **Variables** : copier `.env.example` → `.env` et remplir au minimum :
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/loire?schema=public"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5433/loire?schema=public"
   SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/loire?schema=shadow_prisma"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="change-me"
   ```
   Ajuster `sslmode=require` pour un provider managé, `PRISMA_ACCELERATE_URL` si nécessaire.
2. **Docker Postgres** :
   ```bash
   docker compose down -v
   docker compose up -d db
   ./scripts/db-diag.sh   # optionnel mais recommandé pour valider la connectivité
   ```
3. **Droits shadow** : si l’utilisateur n’a pas `CREATEDB`, créer un schéma dédié (ex. `CREATE SCHEMA shadow_prisma;`) sur la même instance.

### 4.2 Recréer la base
4. Régénérer Prisma : `npm run db:generate`.
5. Appliquer toutes les migrations avec shadow isolé :
   ```bash
   npm run db:dev -- --name init           # ou: node scripts/prisma-shadow.js migrate dev
   ```
   Sur un environnement partagé (CI/prod) : `npm run db:deploy`.
6. (Optionnel) Vérifier la shadow DB : `node scripts/prisma-shadow.js db execute -- --file prisma/migrations/<last>/migration.sql`.

### 4.3 Seed & données de test
7. `npm run seed` pour injecter catégories, artistes de démo, pages CMS et événements.
8. Générer un compte artiste de test si besoin : `node scripts/create_test_artist.js` puis `node scripts/publish_test_artist_profile.js`.
9. Exécuter `ts-node scripts/migrate-legacy-to-artistpage.ts` si des `ProfileCustomization` historiques subsistent.

### 4.4 Vérifications applicatives
10. **Qualité** :
    ```bash
    npm run lint
    npm run typecheck
    npm run test:critical
    ```
11. **Lancer l’app & checks** :
    ```bash
    npm run dev
    BASE_URL=http://localhost:3000 node scripts/health-check.js
    curl -s http://localhost:3000/api/health | jq
    ```
12. **Tests end‑to‑end** (si Playwright installé) : `npm run test:e2e` (prévoir `npx playwright install`).
13. **Stripe webhook** : configurer `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` puis déclencher un event via `stripe trigger checkout.session.completed`.

### 4.5 Production & shadow
14. Sur un environnement prod : exporter `DATABASE_URL`/`DIRECT_URL`/`SHADOW_DATABASE_URL`, puis :
    ```bash
    npm ci
    npm run db:deploy
    npm run build
    npm run health   # ALLOW_HEALTH_ISSUES=0 en prod
    ```
15. Mettre en place une tâche récurrente (cron ou worker) pour `ts-node scripts/cleanup-reservations.ts` toutes les 10 minutes.
16. Avant la bascule vers le schéma v2 : exécuter `npm run db:migrate:v2`, contrôler `docs/db/migration-plan.md`, puis adapter les services à `src/lib/repo/*`.

### 4.6 Entretien continu
- Nettoyer les règles ESLint inutilisées (`app/admin/leads/orders`).
- Supprimer progressivement les `@ts-nocheck` restants (galerie, blog, dashboard artiste).
- Maintenir la configuration Vitest sur l’API ESM (`vitest.config.mts`) pour éviter les avertissements Vite.
- Documenter les intégrations optionnelles (Cloudinary, Upstash, Stripe taxes/shipping) dans `.env`/`DEPLOY.md`.
- Garder `docs/site-db-audit.md` à jour lors de futures évolutions majeures (nouveaux modèles, pipelines, providers).
