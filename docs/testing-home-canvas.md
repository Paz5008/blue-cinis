## Tests UI — Bandeaux & Affiches

### Pré-requis validés par le repo
- Les polices sont auto-hébergées dans `public/fonts` et chargées via Tailwind (aucune requête Google Fonts).
- Les tokens de prévisualisation sont gérés par `@/lib/previewToken` (`/api/artist/canvas-preview` fonctionne sans patch).
- La page sandbox (`app/e2e/editor-sandbox/page.tsx`) est un composant client et ne nécessite plus de `dynamic(..., { ssr: false })`.

### Préparation de l’environnement
1. Copier `.env.example` vers `.env.local` puis renseigner les variables critiques (DB, Upstash, Cloudinary, Stripe, newsletter, etc.).
2. Démarrer Postgres (`docker compose up -d db` ou service managé) puis appliquer les migrations :
   ```bash
   npm run db:deploy
   npm run seed # optionnel pour avoir des artistes de test
   ```
3. Installer Playwright avec ses dépendances système :
   ```bash
   npx playwright install --with-deps
   ```
4. Vérifier que `ALLOW_ANONYMOUS_CANVAS_PREVIEW=0` et que `NEXT_PUBLIC_BASE_URL` pointe vers l’URL utilisée par les tests (`http://localhost:3000` en local).

### Exécution
```bash
npm run build
npm run test:e2e -- --project=chromium e2e/home-banners-posters.spec.ts
npm run test:e2e -- --project=chromium e2e/banner-consistency.spec.ts
```

Les tests vérifient :

- la présence d’un canevas HTML `data-canvas-page="banner"` dans la section « Ils rejoignent la galerie » ;
- la largeur max 1280 px / hauteur 320 px des bandeaux publiés (fallback inclus) ;
- la hauteur 700 px des affiches dans la section posters ;
- la parité visuelle bandeau CMS ↔ home (desktop + mobile). Ajustez `E2E_BANNER_SLUG` ou `E2E_BANNER_DIFF_THRESHOLD` dans l’environnement si vous ciblez un artiste différent ou une tolérance alternative.
