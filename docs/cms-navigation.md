# CMS Navigation Spec

## Objectif
Fournir un menu de navigation modulaire pour le CMS des artistes. L'interface reste neutre, typographique et rapide, tout en laissant une touche personnalisée via `--accent`. Le système couvre topbar sticky, sidebar persistante (mode drawer en mobile) et interactions clavier/composants accessibles.

## Layout global
- Grille 8px, espaces principaux : 12/16/24.
- Topbar : hauteur 64px desktop, 56px mobile; étendue max 1200px centrée, padding horizontal 24px.
- Sidebar : largeur 300px (min 280, max 320), collapsible. En mobile, drawer plein écran avec overlay.
- Canvas central : occupe le reste avec marges 32px (desktop) / 16px (mobile). Raccourcis (chips) alignés au-dessus.
- Panneau inspecteur futur : réservé côté droit (non prioritaire mais mentionné pour ergonomie).

## Topbar
- **Gauche** : bouton retour (icône Lucide `ChevronLeft`) + fil d’Ariane `Éditeur CMS › Profil`. Libellés FR, séparation via `›`.
- **Centre** :
  - Toggle `Éditer | Aperçu` (radio group). Boutons 88px min, hauteur 44px, focus accessible.
  - Device toggle `Desktop | Mobile` avec icônographie (Lucide `Monitor`, `Smartphone`). États exclusifs.
- **Droite** :
  - Actions à portée ≤2 clics : `Enregistrer` (primary), `Publier` (success), `Prévisualiser` (ghost), `Nouvelle œuvre` (accent). Ordre : critique → secondaire → création.
  - Badge `Vérifications 1` (pill) adjacent aux actions.
  - Tooltips sur hover/focus (`aria-describedby`) : ex. « Prévisualiser la page dans un nouvel onglet ».
- Sticky + backdrop blur 12px, ombre douce `var(--shadow-elevated)` uniquement lors du scroll.

### États des boutons
- `default` : contraste ≥7:1 sur fond.
- `hover` : +4% luminosité (ou alpha +0.04).
- `active` : −4% luminosité.
- `disabled` : Opacité 40%, curseur `not-allowed`, pas de shadow.
- `focus-visible` : anneau 2px `--accent` + offset 3px.

## Sidebar
- Entête : titre `Espace créatif` + pill progrès `0% complet`. Progress pill : fond `rgba(--accent, 0.12)`, texte `--accent`, bord arrondi 999px, icon `Sparkle` optionnel.
- Onglets (top) : `Blocs`, `Sections`, `Guides`. Inline flex, 10/16 padding, `aria-controls` + `role="tablist"`.
- Recherche : champ 44px, placeholder `Rechercher un bloc…`, loupe à gauche, bouton clear `×` à droite, `aria-label` explicite.
- Groupes repliables (`role="group"`), ex. `Contenu`. Header 40px, icon caret `ChevronDown`. Persist state dans local storage.
- Items :
  - Grille : icon (lucide `Type`, `Image`, `Images`, `Video`, `Code`, `Quote`), label, optional `badge Populaire`, drag handle (Lucide `GripVertical`).
  - États : normal, hover, active (bord accent + fond tint), focus (anneau 2px), disabled (opacité 40%, pas d’effet).
  - `aria-pressed=true` pour item sélectionné, `aria-describedby` pour badge si nécessaire.
- Menu contextuel `⋮` (button icon) pour actions sur bloc (dupliquer, masquer, etc.), accessible via `aria-haspopup="menu"`.
- Drag-and-drop : ghost preview aligné sur item, `aria-live="polite"` annonce `Bloc Gallery déplacé, position 3 sur 6`.
- Micro-animations : translation 2px lors du drag, fade 120 ms sur hover.

## Raccourcis (chips)
- Placés entre sidebar et canvas.
- Libellés : `Nom d’artiste`, `Photo`, `Biographie`, `Œuvres`.
- Height 36px, padding 0 16px, radius 999px. Hover : tint accent (12%). Focus ring identique.
- Peuvent devenir toggles (ex. `aria-pressed`).

## Toast
- Message `Enregistrement réussi`.
- Affichage bas droite (ou bas centre mobile) pendant 4 s.
- Constraste AA, icône `CheckCircle`.
- Fermeture via bouton `Fermer` (ghost).

## Tokens & thèmes
Variables exposées dans `:root` (extension possible via Tailwind).

```css
:root {
  --bg: #ffffff;
  --surface: #f8fafb;
  --surface-alt: #ffffff;
  --surface-elevated: rgba(11, 13, 15, 0.08);
  --border: #e6e8ec;
  --border-strong: #cfd3d9;
  --text-primary: #0b0d0f;
  --text-secondary: rgba(11, 13, 15, 0.65);
  --text-muted: rgba(11, 13, 15, 0.45);
  --accent: var(--artist-accent, #6a5ae0);
  --accent-positive: #32b687;
  --accent-warning: #f5a20b;
  --accent-danger: #e05a6a;
  --radius-card: 12px;
  --radius-input: 8px;
  --radius-badge: 6px;
  --shadow-elevated: 0 8px 24px rgba(11, 13, 15, 0.12);
  --transition-base: 140ms ease;
}

[data-theme="dark"] {
  --bg: #0b0d0f;
  --surface: #111418;
  --surface-alt: #0b0d0f;
  --surface-elevated: rgba(245, 247, 250, 0.08);
  --border: #262a30;
  --border-strong: #3a3f47;
  --text-primary: #f5f7fa;
  --text-secondary: rgba(245, 247, 250, 0.75);
  --text-muted: rgba(245, 247, 250, 0.55);
  --shadow-elevated: 0 8px 24px rgba(0, 0, 0, 0.35);
}
```

### Tailwind helper (optionnel)
Ajouter dans `tailwind.config.js` :

```js
// tailwind.config.js
const accent = 'var(--accent)';

export default {
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        border: 'var(--border)',
        accent,
        'accent-positive': 'var(--accent-positive)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        input: 'var(--radius-input)',
        badge: 'var(--radius-badge)',
      },
      boxShadow: {
        elevated: 'var(--shadow-elevated)',
      },
      transitionDuration: {
        base: '140ms',
      },
    },
  },
};
```

## Accessibilité
- Contrastes : texte primaire ≥7:1, secondaire ≥4.5:1 (valider via tooling).
- Taille tactile : min 44×44 pour boutons, onglets, items.
- Focus : `:focus-visible` partout, anneau 2px `--accent`.
- Tab order : retour → breadcrumb → toggles → actions → tabs → recherche → listes → chips → toast close → FAB mobile.
- Annonces ARIA drag-and-drop : `aria-grabbed`, `aria-dropeffect`, `aria-live="polite"`.
- Menu contextuel accessible (`role="menu"`, items `role="menuitem"`).
- Mode sombre respecté via `data-theme` (usage existant dans app).

## Responsive
- Desktop : topbar 3 colonnes `auto 1fr auto`.
- Tablet (<1024px) : actions se regroupent en dropdown `Actions rapides` (hors `Enregistrer` qui reste visible).
- Mobile (<768px) :
  - Topbar : icône retour + titre centré, actions principales via menu kebab.
  - FAB `Nouvelle œuvre` bottom-right, 56px, ombre accent.
  - Sidebar devient drawer plein écran (slide-in 280ms) avec search en sticky top.
  - Raccourcis → carrousel horizontal (snap).

## Micro-interactions
- Toggles : animation slider 140ms `ease`.
- Badge `Vérifications` pulse doux (scale 1.05) lorsque >0 non consulté.
- Drawer : overlay fade 160ms.
- Tooltip : delay 160ms, apparition 120ms.

## États à livrer (component library / Storybook)
1. Topbar (clair + sombre).
2. Buttons : primary, success, ghost, accent, icon-only (default/hover/active/disabled/focus).
3. Sidebar item : normal, hover, active, focus, disabled, avec badge `Populaire`.
4. Barre de recherche (default, focus, texte saisi + bouton clear).
5. Menu contextuel bloc.
6. Toast `Enregistrement réussi`.
7. Mobile drawer (clair/sombre) + FAB.

## Implémentation conseillée
1. Créer `components/cms/navigation/Topbar.tsx` et `Sidebar.tsx` (server components compatibles).
2. Mutualiser tokens via `styles/tokens.ts` et classes CSS Modules ou Tailwind plugin.
3. Ajouter stories Storybook (`stories/cms-navigation.stories.tsx`) avec contrôles `accent` et `theme`.
4. Couvrir accessibilité :
   - Tests Playwright pour tab order + mode sombre.
   - Vitest pour composer `aria-*` lors du drag.
5. Lier `--accent` à la palette artiste (context `ArtistThemeProvider`).

## Check QA
- Lecture en 3 s : topbar > tabs > liste. Vérifier sur prototypes.
- Actions critiques ≤2 clics (desktop et mobile).
- Audit contrastes (axe clair/sombre) via `axe-core`.
- Tests manuels sur clavier + lecteurs d’écran (VoiceOver/ NVDA).
