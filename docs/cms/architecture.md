# CMS Architecture

> Architecture complète du système CMS de Loire Gallery

## Vue d'Ensemble

```mermaid
graph TB
    subgraph "Frontend - Editor"
        A[Editor.tsx] --> B[EditorContext]
        B --> C[useEditorBlocks]
        C --> D[Block Operations]
        C --> E[Drag & Drop]
        C --> F[Preview Sync]
    end
    
    subgraph "API Layer"
        G[/api/artist/customization/] --> H[Zod Validation]
        H --> I[Sanitization]
        I --> J[Prisma ORM]
    end
    
    subgraph "Database"
        J --> K[(ArtistPage)]
        K --> L[draftContent]
        K --> M[publishedContent]
    end
    
    subgraph "Public View"
        N[ArtistProfileView] --> O[BlockRenderer]
        O --> P[ContainerRenderer]
        O --> Q[TextRenderer]
        O --> R[ImageRenderer]
    end
    
    D --> G
    M --> N
    
    style A fill:#4ecdc4
    style G fill:#ffe66d
    style K fill:#ff6b6b
```

## Data Flow

### Save Operation

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Zod
    participant Sanitize
    participant Prisma
    participant DB
    
    User->>Editor: Modifie bloc
    Editor->>Editor: isDirty = true
    
    Note over Editor: Auto-save (8s)
    
    Editor->>+Zod: ContentPayloadSchema.parse()
    Zod-->>-Editor: Validated payload
    
    Editor->>+Sanitize: sanitizeTextHtml()
    Sanitize->>Sanitize: sanitizeBlockStylesDeep()
    Sanitize-->>-Editor: Clean content
    
    Editor->>+Prisma: artistPage.upsert()
    Prisma->>+DB: UPDATE
    DB-->>-Prisma: OK
    Prisma-->>-Editor: Updated record
    
    Editor->>User: Toast "Sauvegardé"
```

### Read Operation (GET)

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Zod
    participant Prisma
    participant DB
    
    Client->>+API: GET /api/artist/customization/[key]
    API->>+Prisma: artistPage.findUnique()
    Prisma->>+DB: SELECT
    DB-->>-Prisma: Record
    Prisma-->>-API: ArtistPage
    
    API->>+Zod: ContentPayloadSchema.safeParse()
    
    alt Valid
        Zod-->>-API: Success
    else Invalid
        Zod-->>API: Warning logged, raw data returned
    end
    
    API-->>-Client: JSON response
```

## Fichiers Clés

| Fichier | Responsabilité | Lignes |
|---------|----------------|--------|
| `components/dashboard/Editor.tsx` | Éditeur principal | ~4500 |
| `components/dashboard/editor/EditorContext.tsx` | State management | ~160 |
| `lib/cms/blockRegistry.ts` | Registry des blocs | ~200 |
| `lib/cms/blockValidation.ts` | Validation blocs | ~400 |
| `lib/cms/blockPositioning.ts` | Calcul positions | ~100 |
| `src/lib/cms/style.ts` | Compositing styles | ~300 |
| `src/lib/cmsSchema.ts` | Schémas Zod | ~200 |

## Hooks Architecture

```mermaid
graph LR
    A[useEditorBlocks] --> B[useBlockOperations]
    A --> C[useEditorHistory]
    A --> D[useEditorDragDrop]
    A --> E[usePreviewSync]
    A --> F[useCanvasInteraction]
    A --> G[useBeforeUnload]
    A --> H[useAutoSave]
    
    B --> I[addBlock]
    B --> J[updateBlock]
    B --> K[deleteBlock]
    B --> L[convertBlock]
    
    D --> M[DnD Kit]
    D --> N[HTML5 Drag]
    D --> O[Absolute Drag]
    
    style A fill:#4ecdc4
    style B fill:#95e1d3
    style D fill:#95e1d3
```

## Block System

### Block Types

| Type | Catégorie | Renderer |
|------|-----------|----------|
| `text` | Content | TextRenderer |
| `image` | Media | ImageRenderer |
| `container` | Layout | ContainerRenderer |
| `spacer` | Layout | SpacerRenderer |
| `embed` | Media | EmbedRenderer |
| `artist-name` | Artist | TextRenderer |
| `artist-photo` | Artist | ImageRenderer |
| `artist-bio` | Artist | TextRenderer |

### Block Interface

```typescript
interface Block {
  id: string;
  type: BlockType;
  content: string;
  style?: BlockStyle;
  x?: number;  // Pixels (FreeForm)
  y?: number;  // Pixels (FreeForm)
  children?: Block[];
}
```

## Sécurité

| Couche | Protection |
|--------|------------|
| Input | Zod validation |
| XSS | sanitizeTextHtml() |
| CSS Injection | sanitizeBlockStylesDeep() |
| Embed | sanitizeEmbedBlock() whitelist |
| Auth | ensureArtistSession() |

## Variables d'Environnement

```bash
DATABASE_URL          # PostgreSQL connection
DIRECT_URL            # Direct DB (bypasses pooler)
NEXTAUTH_SECRET       # Auth encryption
```

---

## Système d'Alertes Personnalisées

Les alertes permettent aux collectionneurs de recevoir des notifications lorsqu'une nouvelle œuvre correspond à leurs critères.

### Flow de Déclenchement

```mermaid
sequenceDiagram
    participant Artist as Artiste
    participant API as API Artwork
    participant AlertEngine as triggerAlertCheck()
    participant DB as Database
    participant Notifier as Email/Push
    
    Artist->>API: Publie nouvelle œuvre
    API->>DB: INSERT artwork (status='available')
    API->>AlertEngine: triggerAlertCheck(artworkId)
    
    AlertEngine->>DB: SELECT * FROM ArtAlert WHERE isActive
    AlertEngine->>AlertEngine: matchesAlert() pour chaque alerte
    
    loop Pour chaque alerte matchante
        AlertEngine->>DB: UPDATE lastTriggeredAt
        AlertEngine->>Notifier: Envoyer notification
        
        alt Email activé
            Notifier-->>User: Email "Nouvelle œuvre"
        else Push activé
            Notifier-->>User: Push notification
        end
    end
    
    AlertEngine-->>API: { matchedAlerts: [...] }
```

### Schéma ArtAlert

| Champ | Type | Description |
|-------|------|-------------|
| `id` | String | Identifiant unique |
| `userId` | String | Propriétaire de l'alerte |
| `artistIds` | String[] | Artistes suivis (filtre optionnel) |
| `categoryIds` | String[] | Catégories ciblées |
| `styles` | String[] | Styles recherchés (abstrait, figuratif...) |
| `mediums` | String[] | Techniques (huile, acrylique...) |
| `priceMin` | Int? | Prix minimum |
| `priceMax` | Int? | Prix maximum |
| `emailEnabled` | Boolean | Notification par email |
| `pushEnabled` | Boolean | Notification push |
| `frequency` | Enum | immediate / daily / weekly |
| `isActive` | Boolean | Alerte activée |
| `lastTriggeredAt` | DateTime? | Dernière notification |

### Fonctions Clés (`src/actions/alerts.ts`)

| Fonction | Description |
|----------|-------------|
| `createAlert()` | Crée une nouvelle alerte |
| `updateAlert()` | Modifie les critères |
| `deleteAlert()` | Supprime l'alerte |
| `getUserAlerts()` | Liste les alertes utilisateur |
| `toggleAlertActive()` | Active/désactive |
| `triggerAlertCheck()` | Vérifie les matchs pour une œuvre |

---

*Voir aussi:* [block-sdk.md](./block-sdk.md) | [api.md](./api.md)
