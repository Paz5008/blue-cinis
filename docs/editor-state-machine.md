# Editor State Machine

## Vue d'Ensemble

L'éditeur CMS a plusieurs dimensions d'état qui peuvent se combiner :

- **viewMode** : `'edit'` | `'theme'` | `'preview'`
- **pageKey** : `'profile'` | `'banner'` | `'poster'`
- **layout** : `'flow'` | `'freeForm'`
- **device** : `'desktop'` | `'mobile'` (mobile editor removed)

## State Diagrams

### View Modes

```mermaid
stateDiagram-v2
    [*] --> Edit
    Edit --> Theme: Click Theme tab
    Edit --> Preview: Click Preview tab
    Theme --> Edit: Click Edit tab
    Theme --> Preview: Click Preview tab
    Preview --> Edit: Click Edit tab
    Preview --> Theme: Click Theme tab
    
    Edit: Mode Édition
    Theme: Mode Thème
    Preview: Mode Aperçu
```

**Règles** :
- `viewMode` change via tabs dans toolbar
- En mode Preview : lecture seule, pas d'édition

### Layout Modes

```mermaid
stateDiagram-v2
    [*] --> Flow
    Flow --> FreeForm: pageKey=banner OR user toggle
    FreeForm --> Flow: pageKey≠banner AND user toggle
    
    note right of FreeForm
        Absolute positioning
        Drag & drop custom
    end note
    
    note left of Flow
        Flow layout
        @dnd-kit DnD
    end note
```

**Règles** :
- Banner **force** FreeForm mode
- Poster/Profile par défaut en Flow, toggle possible

## États Valides - Matrice

| viewMode | pageKey | layout | Valide | Notes |
|----------|---------|--------|--------|-------|
| edit | profile | flow | ✅ | État par défaut profile |
| edit | profile | freeForm | ✅ | User a toggleé |
| edit | banner | flow | ❌ | **Banner force freeForm** |
| edit | banner | freeForm | ✅ | État obligatoire banner |
| edit | poster | flow | ✅ | État par défaut poster |
| edit | poster | freeForm | ✅ | User a toggleé |
| theme | * | * | ✅ | Theme mode fonctionne partout |
| preview | * | * | ✅ | Preview lecture seule partout |

## Transitions Interdites

1. `banner + flow` → **IMPOSSIBLE** (force freeForm)
2. `viewMode=preview + édition` → **BLOQUÉ** (mode lecture seule)

## Gestion dans le Code

**Fichier** : `Editor.tsx`

```typescript
const isBanner = pageKey === 'banner';
const isPoster = pageKey === 'poster';
const isFreeForm = isBanner || (/* user toggled */);

// Render
{viewMode === 'edit' ? (
  isFreeForm ? (
    <FreeFormCanvas />
  ) : (
    <DndContext>
      {/* Flow layout */}
    </DndContext>
  )
) : viewMode === 'preview' ? (...) : (...)}
```

## Auto-Save State Flow

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant AutoSave
    participant API
    
    User->>Editor: Modifie bloc
    Editor->>Editor: isDirty = true
    
    Note over AutoSave: Debounce 8 secondes
    
    AutoSave->>API: POST /api/save
    API-->>AutoSave: Success
    AutoSave->>Editor: isDirty = false
    AutoSave->>User: Toast "Sauvegardé"
```

## Error Handling State

```mermaid
stateDiagram-v2
    [*] --> Normal
    Normal --> Error: Exception thrown
    Error --> Fallback: Error Boundary catches
    Fallback --> Normal: User clicks Reset
    Fallback --> Reload: User clicks Reload
    Reload --> [*]
```

---

*Dernière mise à jour : 2026-01-13*
