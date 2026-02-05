Déploiement Blue Cinis (Next.js + Prisma)

1) Prérequis
- Compte Vercel (ou autre hébergeur compatible Next.js)
- Base de données PostgreSQL managée (Neon, Supabase, Render, etc.)
- Fournisseur email (SMTP) fiable: Resend, Mailgun, Postmark ou SMTP de votre hébergeur
- (Optionnel) reCAPTCHA v3 (Google) pour anti-spam

2) Variables d’environnement
À définir sur Vercel (Production + Preview) et dans `.env.local` pour vos postes :

### Base & URLs
- `DATABASE_URL` / `DIRECT_URL` / `SHADOW_DATABASE_URL`
- `NEXTAUTH_URL` (ex: https://blue-cinis.com)
  - `DOMAIN`=https://blue-cinis.com
- `NEXT_PUBLIC_BASE_URL` (doit pointer vers la même origine que DOMAIN)
- `DOMAIN` (utilisé pour les URLs Stripe/email)
- `NEXTAUTH_SECRET` (32+ caractères)
- `ALLOW_ANONYMOUS_CANVAS_PREVIEW=0`

### Emails & anti-spam
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SALES_EMAIL` (reçoit les leads et sert d’expéditeur par défaut)
- `RECAPTCHA_SECRET_KEY` / `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

### Paiement Stripe
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SHIPPING_RATES`, `STRIPE_SHIPPING_COUNTRIES`
- `STRIPE_ENABLE_TAX`, `STRIPE_PM_TYPES` (optionnels)
- `PAYMENTS_PROVIDER=stripe` (les autres PSP ne sont pas activés)

### Réservations catalogue
- `RESERVATION_TTL_MIN=15` (TTL serveur pour Stripe/réservations)
- `NEXT_PUBLIC_RESERVATION_TTL_MIN=15` (même valeur côté client pour l’UI sélection)

### Newsletter
- `NEWSLETTER_PROVIDER=brevo`
- `BREVO_API_KEY`
- `BREVO_LIST_ID` (identifiant numérique de la liste de diffusion)

### Rate limiting & MFA
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (obligatoire en prod)

### Médias & uploads
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER=uploads` (ou votre dossier)
- `CLOUDINARY_AUTHENTICATED=true`, `CLOUDINARY_SIGNED_TTL=300`
- `IMAGE_DOMAINS=res.cloudinary.com,images.unsplash.com,i.imgur.com`

### Observabilité & analytics
- `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`
- `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_REPLAYS_*`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` ou `NEXT_PUBLIC_UMAMI_*` (selon l’outil retenu)

### Cron & divers
- `CRON_CLEANUP_SECRET` (optionnel – requis pour déclencher manuellement la route cron)
- `ADMIN_OVERRIDE_EMAILS`, `ADMIN_MFA_BYPASS`, `ENABLE_DEV_AUTO_USER` (réservés aux environnements internes)
- `CLOUDINARY_AUTHENTICATED`, `CLOUDINARY_SIGNED_TTL`, `ALLOW_ANONYMOUS_CANVAS_PREVIEW` doivent rester synchronisés avec la prod.

3) Première mise en ligne
- Pousser le repo sur GitHub/GitLab
- Importer le projet sur Vercel
- Renseigner toutes les variables d’environnement
- Provisionner la base Postgres (Neon/Supabase) et récupérer la DATABASE_URL
- Exécuter les migrations Prisma:
  - Vercel: configurer un hook post-déploiement ou lancer `npx prisma migrate deploy` sur un environnement runner (ou via pipeline CI)
  - Local: `npx prisma migrate deploy` avec DATABASE_URL pointant vers la prod
- (Optionnel) Injecter des données de démo:
  - `npm run seed` (vérifiez que le script cible bien la base souhaitée)

4) Vérifications post-déploiement
- Authentification (inscription client avec email d’activation)
- Inscription artiste (réception email admin et confirmation utilisateur)
- Library médias (uploads)
- Galerie et fiches œuvres
- Page artiste et publication de contenu
- Envoi email via /api/leads
- sitemap.xml et robots.txt accessibles

5) Sécurité & Monitoring
- Activer HTTPS (Vercel: automatique)
- Sentry (ou équivalent) pour les erreurs
- Analytics (Plausible/Umami ou GA4) — ajouter le script côté app/layout si souhaité
- Rate-limiting endpoints sensibles (auth, uploads, leads) via Upstash/Redis (à implémenter si trafic élevé)
- Sentry: les fichiers sentry.client.config.ts et sentry.server.config.ts initialisent le SDK si les DSN sont définis.

6) Évolutions Paiement (phase 1.5)
- Stripe Checkout: créer une session à la volée pour l'œuvre (prix unique), marquer l'œuvre "réservée" pendant le checkout.
- Webhooks Stripe (Serverless function) pour marquer l’œuvre “vendue” (checkout.session.completed).
- Pages /success et /cancel.
- Variables Stripe à prévoir:
  - STRIPE_SECRET_KEY=sk_live_...
  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
  - STRIPE_WEBHOOK_SECRET=whsec_...
  - (optionnel) LOCALE=fr
  - (optionnel) DOMAIN=https://loire-gallery.com (pour success_url / cancel_url)

7) Check-list DNS
- Ajouter le domaine custom dans Vercel
- Configurer CNAME/A/AAAA selon les instructions Vercel
- Authentifier le domaine email (SPF/DKIM) chez votre fournisseur SMTP

Cloudinary (optional; enable to store media in the cloud and auto-generate thumbnails)
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_FOLDER (optional, default: uploads)

Stripe shipping/tax config (optional)
- STRIPE_ENABLE_TAX=true
- STRIPE_PM_TYPES=card,sepa_debit
- STRIPE_SHIPPING_RATES=shr_... (comma separated)
- STRIPE_SHIPPING_COUNTRIES=FR,BE,DE,ES,IT,NL,LU,CH,GB

Authenticated Cloudinary
- CLOUDINARY_AUTHENTICATED=true to upload as type=authenticated
- CLOUDINARY_SIGNED_TTL=300 (seconds) for /api/media signed redirects
- /api/media/<publicId>[?w=&h=&fit=] generates a signed URL and redirects (keep MediaLibrary compatible)

Migration scripts
- scripts/migrate-uploads-to-cloudinary.ts — migrate local public/uploads to Cloudinary and write mapping JSON
- scripts/replace-uploads-urls.ts — replace DB URL fields using that mapping

## Local switch helper (no CI required)

If you don't use GitHub Actions, you can run the local helper to complete the Cloudinary switch end-to-end.

Commands:
- ts-node scripts/sitewide-cloudinary-switch.local.ts --mode=migrate_only
- ts-node scripts/sitewide-cloudinary-switch.local.ts --mode=dry
- ts-node scripts/sitewide-cloudinary-switch.local.ts --mode=full   (recommended)

What it does:
- Applies Prisma migrations (migrate deploy)
- Migrates local public/uploads to Cloudinary
- Shows a dry-run of DB URL rewrites
- Performs the full switch to /api/media proxy URLs if mode=full (and updates .env if needed)

Cron (recommended):
- Run every 10 minutes: npx ts-node scripts/cleanup-reservations.ts

## Tâches planifiées & migrations Prisma v2

### Routine `cleanup-reservations`
- Objectif : libérer les réservations expirées et remettre `reservedUntil` à `null`.
- API dédiée : `GET /api/cron/cleanup-reservations` (protégée par l’en-tête `x-vercel-cron`; ajoutez `x-cron-secret` pour les déclenchements manuels).
- Scheduler Vercel : `vercel.json` inclut un cron `*/10 * * * *` vers cette route. Vérifiez dans le dashboard que le job est bien actif et que `CRON_CLEANUP_SECRET` est défini si vous souhaitez l’appeler hors Vercel.
- Fallback manuel : `npm run cleanup:reservations` (exécute `ts-node scripts/cleanup-reservations.ts`).

### Backfill v2 (`scripts/migrate-to-v2.ts`)
Avant d’annoncer la bascule slug/enum/currency décrite dans `docs/db/migration-plan.md` :
1. Sauvegarder la base (snapshot provider).
2. Exécuter `npm run db:migrate:v2` sur l’environnement ciblé (ou `ts-node scripts/migrate-to-v2.ts` si vous avez besoin d’options supplémentaires).
3. Vérifier les rapports (unicité des slugs, currency renseignée) et verrouiller les contraintes via `npm run db:deploy`.
4. Passer la checklist `/api/health`, `npm run lint`, `npm run typecheck`, `npm run test:critical` et `npm run test:e2e` avant de marquer la version comme “finale”.
