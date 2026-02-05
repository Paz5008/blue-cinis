# Block SDK Documentation

> Guide de création et d'enregistrement de nouveaux blocs CMS

## Architecture

Le système de blocs utilise un **Block Registry** centralisé qui permet :
- Enregistrement dynamique de types de blocs
- Récupération de composants Inspector/Renderer par type
- Création de blocs avec props par défaut
- Validation via schemas Zod

## API Principale

### registerBlock
```typescript
import { registerBlock } from '@/lib/cms/blockRegistry';
import { Type } from 'lucide-react';
import { TextBlockSchema } from '@/lib/cms/blockValidation';

registerBlock({
  type: 'text',
  label: 'Texte',
  icon: Type,
  category: 'content',
  schema: TextBlockSchema,
  Inspector: TextInspector,
  Renderer: TextRenderer,
  defaultProps: () => ({ content: '<p>Nouveau texte</p>' }),
});
```

### getBlockDefinition / getBlockInspector / getBlockRenderer
```typescript
import { getBlockDefinition, getBlockInspector } from '@/lib/cms/blockRegistry';

const def = getBlockDefinition('text');
const Inspector = getBlockInspector('text');
```

### createBlock
```typescript
import { createBlock } from '@/lib/cms/blockRegistry';
import type { TextBlock } from '@/types/cms';

const block = createBlock<TextBlock>('text', {
  content: '<p>Contenu personnalisé</p>',
});
// Génère un ID unique automatiquement
```

### listBlocks
```typescript
import { listBlocks } from '@/lib/cms/blockRegistry';

// Tous les blocs
const allBlocks = listBlocks();

// Par catégorie
const contentBlocks = listBlocks('content');
const artistBlocks = listBlocks('artist');
```

## Catégories

| Catégorie | Description |
|-----------|-------------|
| `content` | Texte, image, vidéo, quote, embed |
| `structure` | Colonnes, container, spacer, divider |
| `artist` | Nom, photo, bio |
| `media` | Galerie, oeuvre, artworkList |
| `interaction` | Button, contactForm, eventList |

## Interface BlockDefinition

```typescript
interface BlockDefinition<T extends Block> {
  type: BlockType;           // Identifiant unique
  label: string;             // Label UI
  icon: LucideIcon;          // Icône Lucide
  category: BlockCategory;   // Catégorie palette
  schema: ZodTypeAny;        // Schema validation
  Inspector: ComponentType;  // Composant édition
  Renderer: ComponentType;   // Composant affichage
  defaultProps: () => Partial<T>;  // Props par défaut
  description?: string;      // Tooltip (opt)
  isContainer?: boolean;     // Peut contenir enfants (opt)
}
```

## Créer un nouveau bloc

### 1. Définir le type
```typescript
// types/cms.ts
export interface MyCustomBlock extends BaseBlock {
  type: 'myCustom';
  myField: string;
  myOptionalField?: number;
}
```

### 2. Créer le schema Zod
```typescript
// lib/cms/blockValidation.ts
const MyCustomBlockSchema = BaseBlockSchema.extend({
  type: z.literal('myCustom'),
  myField: z.string(),
  myOptionalField: z.number().optional(),
});
```

### 3. Créer l'Inspector
```typescript
// components/dashboard/inspectors/MyCustomInspector.tsx
export function MyCustomInspector({ block, onUpdate }: InspectorProps<MyCustomBlock>) {
  return (
    <div>
      <Input
        value={block.myField}
        onChange={(e) => onUpdate({ ...block, myField: e.target.value })}
      />
    </div>
  );
}
```

### 4. Créer le Renderer
```typescript
// components/cms/renderers/MyCustomRenderer.tsx
export function MyCustomRenderer({ block }: { block: MyCustomBlock }) {
  return <div>{block.myField}</div>;
}
```

### 5. Enregistrer le bloc
```typescript
// lib/cms/blockRegistrations.ts
import { registerBlock } from './blockRegistry';
import { Box } from 'lucide-react';

registerBlock<MyCustomBlock>({
  type: 'myCustom',
  label: 'Mon Bloc',
  icon: Box,
  category: 'content',
  schema: MyCustomBlockSchema,
  Inspector: MyCustomInspector,
  Renderer: MyCustomRenderer,
  defaultProps: () => ({ myField: '' }),
});
```

## Fichiers clés

| Fichier | Description |
|---------|-------------|
| `lib/cms/blockRegistry.ts` | SDK core avec register/get/create |
| `lib/cms/blockValidation.ts` | Schemas Zod pour validation |
| `lib/cms/blockRegistrations.ts` | Enregistrement des 18 blocs |
| `types/cms.ts` | Interfaces TypeScript |

## Tests

Les tests du registry sont dans `test/lib.blockRegistry.test.ts` (20 tests).

```bash
npx vitest run test/lib.blockRegistry.test.ts
```
