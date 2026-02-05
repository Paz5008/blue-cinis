# CMS Editor

> Éditeur WYSIWYG pour la création de pages d'artistes customisables.

## 🚀 Quick Start

```typescript
import Editor from '@/components/dashboard/Editor';

<Editor
  initialContent={{ blocks: [], theme: {} }}
  oeuvreOptions={artworks}
  artistData={artist}
  pageKey="profile"
/>
```

## 📖 Concepts Clés

### Modes

L'éditeur a 3 modes de vue :

- **Edit** : Édition des blocs (ajout, suppression, déplacement)
- **Theme** : Personnalisation du thème visuel (couleurs, fonts, etc.)
- **Preview** : Aperçu du rendu final (lecture seule)

### Layouts

Deux systèmes de positionnement :

- **Flow** : Layout vertical classique avec drag & drop via `@dnd-kit`
- **FreeForm** : Positionnement absolu libre (X/Y coordinates)

**Note** : Banner force toujours FreeForm mode.

### Blocs

Types de blocs disponibles :

| Type | Description |
|------|-------------|
| `text` | Texte riche (éditeur WYSIWYG) |
| `image` | Image uploadée ou URL |
| `gallery` | Galerie d'images |
| `video` | Embed vidéo (YouTube, Vimeo) |
| `embed` | Code embed custom |
| `quote` | Citation stylisée |
| `divider` | Séparateur visuel |
| `columns` | Layout multi-colonnes |
| `button` | Bouton call-to-action |
| `spacer` | Espace vertical |
| `oeuvre` | Artwork showcase |
| `artworkList` | Liste d'artworks |
| `artistName` | Nom de l'artiste |
| `artistPhoto` | Photo de l'artiste |
| `artistBio` | Biographie |
| `contactForm` | Formulaire de contact |
| `eventList` | Liste d'événements |

Voir [`types/cms.ts`](../types/cms.ts) pour les définitions complètes.

## 🏗️ Architecture

### Diagrammes

- **State Machine** : [editor-state-machine.md](./editor-state-machine.md)
- **Architecture** : [editor-architecture.md](./editor-architecture.md)

### Context Pattern

L'éditeur utilise un **split context** pour optimiser les performances :

```typescript
// ✅ Bon : Composant ne re-render que si actions changent
const { addBlock, updateBlock } = useEditorActions();

// ✅ Bon : Composant ne re-render que si state change  
const { blocks, theme } = useEditorState();

// ⚠️ Éviter : Re-render à chaque changement
const context = useEditorContext(); // Utilise les deux contextes
```

### Hooks Principaux

| Hook | Responsabilité |
|------|----------------|
| `useEditorBlocks` | Gestion state des blocs (CRUD, history) |
| `useBlockOperations` | Opérations sur blocs (add, remove, move) |
| `useEditorHistory` | Undo/Redo |
| `useEditorDragDrop` | Logique drag & drop |
| `usePreviewSync` | Synchronisation edit → preview |
| `useBeforeUnload` | Protection perte de données |

## 🔧 Contributing

### Ajouter un Nouveau Type de Bloc

1. **Définir le type** dans `types/cms.ts` :
```typescript
export interface MyNewBlock extends BaseBlock {
  type: 'myNew';
  customProp: string;
}
```

2. **Créer le renderer** dans `components/cms/blocks/MyNewBlock.tsx` :
```typescript
export function MyNewBlock({ block }: { block: MyNewBlock }) {
  return <div>{block.customProp}</div>;
}
```

3. **Ajouter au RENDERER_MAP** dans `BlockRenderer.tsx` :
```typescript
const RENDERER_MAP = {
  // ...
  myNew: MyNewBlock,
};
```

4. **Ajouter à la palette** dans `EditorSidebar.tsx` :
```typescript
<BlockButton type="myNew" icon={...} label="Mon Nouveau Bloc" />
```

### Ajouter un Test E2E

Tests dans `/e2e` avec Playwright :

```bash
npm run test:e2e        # Run all tests
npm run test:e2e:ui     # Interactive mode
npm run test:e2e:debug  # Debug mode
```

Exemple de test :

```typescript
test('should add and save a block', async ({ page }) => {
  await page.goto('/dashboard-artist/customization/profile');
  await page.click('[data-testid="add-block-text"]');
  await page.fill('[contenteditable="true"]', 'Test');
  await page.click('[data-testid="save-button"]');
  await expect(page.locator('text=/Sauvegarde effectuée/i')).toBeVisible();
});
```

## 🔐 Security

### XSS Protection

Tout contenu HTML est sanitizé :

```typescript
import { sanitizeTextHtml } from '@/lib/sanitize';

const safeHtml = sanitizeTextHtml(userInput);
```

### Data Loss Prevention

- **Auto-save** : Sauvegarde automatique toutes les 8 secondes
- **beforeunload** : Warning si fermeture avec modifications non sauvegardées
- **Error Boundary** : Récupération gracieuse si crash

## 📊 Performance

### Métriques

- **TTI** (Time to Interactive) : < 3s
- **Bundle size** : ~200KB (avec code splitting)
- **Re-renders** : Optimisés via React.memo et split context

### Optimisations

- Dynamic imports pour modals
- Debouncing (auto-save: 8s, preview: 300ms)
- Virtual scrolling (TODO pour >50 blocs)

## 🐛 Debugging

### Activer les logs

```typescript
// Dans Editor.tsx, décommenter :
// console.log('[Editor] State:', { blocks, theme, isDirty });
```

### DevTools

- **React DevTools** : Observer context et re-renders
- **Redux DevTools** : (non utilisé actuellement)

### Erreurs Communes

**Bloc ne s'affiche pas** :
- Vérifier que le type est dans `RENDERER_MAP`
- Vérifier que `enableAbsolutePositioning` est cohérent

**Position incorrecte** :
- Vérifier `blockPositioning.ts` (conversion % → pixels)
- Container width = 1200px partout

## 📚 Ressources

### Documentation

- [State Machine](./editor-state-machine.md)
- [Architecture](./editor-architecture.md)
- [Plan P0/P1](../.gemini/antigravity/brain/.../p0_p1_implementation_plan.md)

### Externes

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)

## ⚡ Scripts Utiles

```bash
# Développement
npm run dev

# Tests
npm run test:e2e
npm run test:e2e:ui

# Build
npm run build

# Lint
npm run lint
```

## 🗺️ Roadmap

### ✅ Complété
- [x] P0 : beforeunload protection
- [x] P0 : Auto-save UX
- [x] P0 : Error Boundary
- [x] Preview synchronization
- [x] Position conversion % → pixels
- [x] Dynamic container width

### 🔄 En cours
- [ ] P1-6 : Documentation (ce README)
- [ ] P1-5 : Tests E2E
- [ ] P1-4 : Refactoring Editor.tsx (4571 → <500 lignes)

### 📝 À venir
- [ ] State machine (XState)
- [ ] Virtual scrolling
- [ ] Performance monitoring
- [ ] Storybook pour design system

---

**Besoin d'aide ?** Consulter la [documentation d'architecture](./editor-architecture.md) ou ouvrir une issue.

*Dernière mise à jour : 2026-01-13*
