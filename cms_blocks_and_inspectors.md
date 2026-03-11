# CMS Blocks & Inspectors

## Overview
This document references all available CMS blocks and their corresponding inspectors in the Blue Cinis dashboard.
Inspectors are located in `components/dashboard/inspectors/` and are mapped in `components/dashboard/BlockInspector.tsx`.

## Block Registry

| Block Type | Inspector Component | Description |
|------------|---------------------|-------------|
| `text` | `TextInspector` | Rich text editing with formatting tools. |
| `image` | `ImageInspector` | Image selection, alt text, caption, and sizing. |
| `gallery` | `GalleryInspector` | Multiple image management, grid/masonry layouts. |
| `video` | `VideoInspector` | HTML5 video with controls, autoplay, loop. |
| `embed` | `EmbedInspector` | Third-party embeds (YouTube, Vimeo, SoundCloud). |
| `button` | `ButtonInspector` | Call-to-action buttons with alignment and links. |
| `spacer` | `SpacerInspector` | Vertical spacing control under "Styles". |
| `oeuvre` | `OeuvreInspector` | Display a selection of artworks manually or via query. |
| `artworkList` | `ArtworkListInspector` | Advanced artwork list with querying and filtering. |
| `eventList` | `EventListInspector` | List of events/dates. |
| `container` | `ContainerInspector` | Structural container styling. |
| `columns` | `ColumnsInspector` | Multi-column layout management. |
| `artistName` | `ArtistNameInspector` | Displays global artist name with style overrides. |
| `artistBio` | `ArtistBioInspector` | Displays global artist biography. |
| `artistPhoto` | `ArtistPhotoInspector` | Displays global artist photo. |
| `divider` | `DividerInspector` | Horizontal rule with customizable style/color. |
| `quote` | `QuoteInspector` | Blockquote with citation/author. |
| `contactForm` | `ContactFormInspector` | Simple contact form integration. |

## Style Configuration (`registry.ts`)

Styles are managed via `src/lib/inspector/registry.ts`. Each block type has a whitelist of allowed style properties grouped by category (Layout, Appearance, Typography, etc.).

### Allowed Styles Config

```typescript
// Mapping from src/lib/inspector/registry.ts
const ALLOWED_STYLES = {
  text: {
    layout: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'padding', 'widthResp'],
    appearance: ['backgroundColor', 'borderRadius'],
    typography: ['textAlign'],
  },
  image: {
    layout: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'widthResp'],
    appearance: ['borderRadius', 'boxShadow', 'objectFit', 'objectPosition'],
    behavior: ['hoverScale', 'hoverOpacity', 'hoverTransitionMs'],
  },
  // ... (refer to registry.ts for full list)
};
```

## Shared Components

- **`CommonSettings`**: Handles common geometric properties (x, y, rotation, zIndex) and visibility toggles (Desktop/Mobile).
- **`CommonStyles`**: Renders the "Styles" tab based on the registry configuration, using `StyleAccordionGroup` and generated controls.
- **`SpacingControl`**: Specialized input for margin/padding (top, right, bottom, left).

## Recent Updates

- **Theme Standardization**: All inspectors now use standard Tailwind CSS classes (light theme) instead of legacy `var(--cms-...)` CSS variables.
- **Type Safety**: `DividerInspector`, `QuoteInspector` and others now correctly handle TypeScript union types using valid casts.
