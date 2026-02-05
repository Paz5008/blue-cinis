# Block SDK Guide

> Comment créer et enregistrer un nouveau type de bloc dans le CMS

## Quickstart

### 1. Définir le Type

```typescript
// types/cms.ts
export type BlockType = 
  | 'text'
  | 'image'
  | 'container'
  | 'your-new-block'  // Ajouter ici
```

### 2. Enregistrer le Bloc

```typescript
// lib/cms/blockRegistrations.ts
import { blockRegistry } from './blockRegistry';

blockRegistry.register({
  type: 'your-new-block',
  category: 'content',  // 'content' | 'layout' | 'media' | 'artist'
  label: 'Mon Nouveau Bloc',
  icon: '🆕',
  defaultContent: '',
  defaultStyle: {
    padding: '16px',
    backgroundColor: 'transparent',
  },
  allowedChildren: [],  // Types de blocs enfants autorisés
  isLayoutBlock: false,
});
```

### 3. Créer le Renderer

```tsx
// components/cms/renderers/YourNewBlockRenderer.tsx
import type { Block } from '@/types/cms';
import { composeWrapperStyle } from '@/lib/cms/style';

interface Props {
  block: Block;
  canvasWidth?: number;
}

export default function YourNewBlockRenderer({ block, canvasWidth }: Props) {
  const wrapperStyle = composeWrapperStyle(block, canvasWidth);
  
  return (
    <div style={wrapperStyle}>
      {/* Votre rendu ici */}
      {block.content}
    </div>
  );
}
```

### 4. Ajouter au BlockRenderer

```tsx
// components/cms/BlockRenderer.tsx
import YourNewBlockRenderer from './renderers/YourNewBlockRenderer';

// Dans le switch case:
case 'your-new-block':
  return <YourNewBlockRenderer block={block} canvasWidth={canvasWidth} />;
```

### 5. Créer l'Inspector

```tsx
// components/dashboard/inspectors/YourNewBlockInspector.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommonSettings } from './shared/CommonSettings';
import { CommonStyles } from './shared/CommonStyles';

interface Props {
  block: Block;
  onChange: (updates: Partial<Block>) => void;
}

export default function YourNewBlockInspector({ block, onChange }: Props) {
  return (
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">Contenu</TabsTrigger>
        <TabsTrigger value="style">Style</TabsTrigger>
        <TabsTrigger value="settings">Réglages</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content">
        {/* Vos contrôles de contenu */}
      </TabsContent>
      
      <TabsContent value="style">
        <CommonStyles block={block} onChange={onChange} />
      </TabsContent>
      
      <TabsContent value="settings">
        <CommonSettings block={block} onChange={onChange} />
      </TabsContent>
    </Tabs>
  );
}
```

### 6. Enregistrer l'Inspector

```tsx
// components/dashboard/editor/inspectorLoader.tsx
const YourNewBlockInspector = lazy(() => 
  import('@/components/dashboard/inspectors/YourNewBlockInspector')
);

// Dans INSPECTOR_MAP:
'your-new-block': YourNewBlockInspector,
```

## Block Interface

```typescript
interface Block {
  id: string;           // UUID unique
  type: BlockType;      // Type du bloc
  content: string;      // Contenu principal (HTML/URL)
  style?: BlockStyle;   // Styles CSS
  x?: number;           // Position X (pixels, FreeForm)
  y?: number;           // Position Y (pixels, FreeForm)
  children?: Block[];   // Blocs enfants (containers)
  tag?: keyof JSX.IntrinsicElements;  // Tag HTML (h1, p, etc.)
}
```

## BlockStyle

```typescript
interface BlockStyle {
  // Layout
  width?: string;
  height?: string;
  position?: 'relative' | 'absolute';
  
  // Spacing
  padding?: string;
  margin?: string;
  
  // Visual
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;
  boxShadow?: string;
  
  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;
}
```

## Composants Partagés

| Composant | Usage |
|-----------|-------|
| `CommonStyles` | Padding, margin, background, border |
| `CommonSettings` | ID, visibility, CSS classes |
| `TypographyControls` | Font, size, color, alignment |
| `SharedBorderControl` | Border width, style, color, radius |
| `SharedMarginControl` | Margin top/right/bottom/left |
| `BoxModelControl` | Padding uniforme |

## Validation

Ajouter dans `lib/cms/blockValidation.ts`:

```typescript
export function validateYourNewBlock(block: Block): ValidationResult {
  const errors: string[] = [];
  
  if (!block.content) {
    errors.push('Content is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Checklist

- [ ] Type ajouté dans `types/cms.ts`
- [ ] Bloc enregistré dans `blockRegistrations.ts`
- [ ] Renderer créé dans `renderers/`
- [ ] Case ajouté dans `BlockRenderer.tsx`
- [ ] Inspector créé dans `inspectors/`
- [ ] Inspector enregistré dans `inspectorLoader.tsx`
- [ ] Validation ajoutée si nécessaire
- [ ] Tests ajoutés

---

*Voir aussi:* [architecture.md](./architecture.md) | [api.md](./api.md)
