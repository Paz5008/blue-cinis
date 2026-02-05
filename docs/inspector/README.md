# CMS Inspector – Plan d'audit et d'amélioration

Objectifs
- Clarifier: chaque paramètre va dans l’onglet pertinent, sans doublon.
- Normaliser: mêmes concepts = mêmes libellés et mêmes types de contrôle.
- Étoffer: ajouter les réglages manquants réellement utiles.
- Optimiser l’UX: privilégier sliders, toggles, presets, media pickers.
- Maintenir: réduire le code dupliqué via contrôles transverses.

Méthode (résumé)
1) Cartographier l’existant (Param Matrix CSV).
2) Règles d’onglets (Content / Layout / Appearance / Accessibility / Advanced).
3) Éliminer les doublons et déplacer les réglages vers l’onglet source de vérité.
4) Choisir les types de contrôle (sliders, toggles, presets) selon heuristiques.
5) Ajouter les paramètres manquants pertinents par bloc.
6) Normaliser libellés et unités, masquer les réglages non pertinents.
7) Factoriser des contrôles génériques (SpacingControls, HoverControls, etc.).
8) QA + micro-tests utilisateurs.
9) Déploiement par lots (Image/ArtworkList/Container/Text d’abord).

Livrables
- docs/inspector/param-matrix.csv (présent)
- Implémentations progressives dans components/dashboard/BlockInspector.tsx et ./controls/

Notes
- Les premières optimisations (position absolue: clamp, preserve Right/Bottom, nudge clavier, boutons d’ancrage) sont déjà en place.
- Les onglets sont normalisés (Content / Layout / Appearance) dans le code.



Génération automatique (registry)
- Script: scripts/generate-inspector-registry.ts
- Commande: npm run inspector:gen
- Produit:
  - docs/inspector/param-registry.json (par bloc, paramètres plats avec type et suggestions d’onglet/contrôle)
  - docs/inspector/param-matrix.generated.csv (CSV prêt à comparer/éditer)
  - docs/inspector/audit-report.md (écarts avec docs/inspector/param-matrix.csv et doublons détectés)

Notes d’utilisation
- Le générateur lit types/cms.ts (schéma source de vérité) et propose des heuristiques:
  - Onglet: content | settings | styles (theme pour ThemeConfig)
  - Contrôle: toggle, segmented/select (enum), color, media, number, slider+number, text (CSS)
- Mettez à jour docs/inspector/param-matrix.csv au fur et à mesure; relancez la génération pour suivre les manquants/obsolètes.
