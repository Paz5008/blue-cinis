# Migration Plan to v2 Schema

This document outlines the safe, incremental migration from the current schema (v1) to the proposed v2 schema (see ERD-v2.mmd and prisma/schema.v2.prisma).

## Strategy
- Non-destructive, forward-only migrations where possible.
- Keep v1 running while introducing v2-compatible fields and indexes.
- Add a data access layer (repositories) to decouple application code from schema differences.
- Backfill data in batches. Validate with SELECT counts and constraints.
- Cutover to v2-only reads when confidence is high.

## Key Changes
- Slugs unique and required for Artist, Artwork, Category, BlogPost.
- Enums for statuses (Reservation, Order, Fulfillment, Publish).
- Artist commerce settings normalized.
- Artwork.currency explicitly stored (default EUR).
- Category.slug added and indexed.
- Order normalization: enums + indexes.

## Steps
1) Pre-migration
   - Add missing columns to v1 with defaults:
     - category.slug, blogPost.slug, artwork.slug
     - artwork.currency (default 'EUR')
     - enums via string columns + check constraints (Prisma enums map to strings)
   - Create indexes for future access patterns.

2) Backfill
   - Generate slugs for existing records (based on name/title; ensure uniqueness with suffixes).
   - For missing currency: default to EUR.
   - Ensure constraints uniqueness (e.g., userId unique for artists).

3) Repository Layer
   - Introduce src/lib/repo with functions that read the new columns but still support fallback to old fields.
   - Feature flags to switch routes progressively to the repo layer.

4) Validation
   - E2E tests against PRISMA_MOCK and against real Postgres in CI (integration job).
   - Add health checks for constraint presence (already partly present in /api/health).

5) Cutover
   - Switch all routes to rely on repo layer (v2-compatible).
   - Optional: deprecate legacy columns; plan removal only after one or more releases.

## Rollback Plan
- Backups before applying migrations to production.
- Forward-only migrations; rollback by redeploying previous app version and restoring data from backup if necessary.

## Scripts
- scripts/migrate-to-v2.ts: applies transformations, creates slugs, sets currencies, ensures enum-compatible values.
- scripts/backfill-v2.ts: idempotent backfill of slugs and derived fields.

## Execution checklist
1. Placer l’appli en maintenance (ou activer un mode lecture seule) et sauvegarder la base.
2. `npm run db:migrate:v2` (ou `ts-node scripts/migrate-to-v2.ts`) sur la base cible.
3. Vérifier les logs de backfill (comptes d’occurrences, slugs générés, currencies non nulles) puis lancer `npm run db:deploy`.
4. Redéployer l’app, contrôler `/api/health` ainsi que `npm run lint`, `npm run typecheck`, `npm run test:critical` et `npm run test:e2e`.
5. Mettre à jour cette fiche si de nouveaux champs ou constraints sont ajoutés.
