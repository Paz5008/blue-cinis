# Thème & Mode sombre

## Architecture
- Le thème courant est résolu côté serveur dans `app/layout.tsx` puis injecté en attributs (`data-theme`, classe `dark`).
- Côté client, `context/ThemeContext.tsx` synchronise les classes, stocke la préférence (`localStorage`, cookie `theme`) et expose `toggleTheme`.
- Le menu (desktop & mobile) consomme ce contexte pour offrir une bascule cohérente.

## Tokens à utiliser
- Les couleurs et surfaces sont centralisées dans `app/globals.css` via les variables `--color-*` et alias (`--nav-*`, `--accent-*`).
- `styles/tokens.ts` expose ces variables pour les composants TypeScript ou Storybook.
- Ajouter de nouvelles couleurs passe par `:root` et `.dark` afin de garder la parité clair/sombre.

## Checklist QA manuelle
1. Charger la home en clair : vérifier l’absence de flash et la cohérence du background (`body`).
2. Activer le mode sombre via la navbar (desktop) puis recharger : `html[data-theme="dark"]` doit persister.
3. Ouvrir le menu mobile, activer le mode sombre, fermer. Vérifier la restitution du focus sur le bouton hamburger.
4. Tester les modales (connexion, inscription) en clair et sombre : contrastes suffisants, focus visible.
5. Naviguer vers `/galerie`, `/artistes`, `/evenements` pour contrôler les titres et CTA en mode sombre.

## Tests automatisés
- `e2e/theme-mode.spec.ts` valide la persistance du cookie `theme` et l’attribut `data-theme`.
- Étendre au besoin avec d’autres scénarios Playwright (ex. ouverture modale en mode sombre).