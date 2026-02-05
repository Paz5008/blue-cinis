---
description: Création complète d'un preset de layout artistique (unifié)
---

## Phase 1 - Analyse des Tokens

Analyse les fichiers suivants pour comprendre le système de design :

- `types/cms.ts` : Interface `BlockStyle` et types de blocs
- `src/lib/cms/themeTokens.ts` : Palettes, typographies, espacements, surfaces

Propriétés visuelles à exploiter :
- `borderRadius`, `boxShadow`, `blendMode`, `noise`, `hoverScale`, `zIndex`
- Couleurs des `PALETTE_PRESETS`
- Espacements des `SPACING_PRESETS`

---

## Phase 2 - Génération Mathématique (Sans Moteur Physique)

Crée une fonction `generateScatterLayout()` qui :

### 2.1 Configuration "Vibe"
- Pioche aléatoirement dans les couleurs de `themeTokens.ts`
- Rotation variée (-15° à +15°) pour casser la grille
- `zIndex` aléatoires (1-10) pour profondeur

### 2.2 Instanciation des Blocs
- 1 `artistName` (taille large, zIndex max, ancre centrale)
- 2-3 `artwork` (tailles variées)
- 1-2 `sticker` (petits, rotation forte)
- 1-2 `text` (courts extraits)

### 2.3 Positionnement "Nuage" (Coordonnées Polaires)
- Place l'ancre au centre (50%, 50%)
- Génère positions polaires (angle 0-360°, distance aléatoire)
- Convertit en coordonnées cartésiennes (x%, y%)

### 2.4 Résolution de Conflits (AABB)
- Vérifie chevauchements via Axis-Aligned Bounding Box
- Si overlap > 10%, repousse vers l'extérieur
- ⚠️ **Pas de moteur physique** (respecte `nogravity.md`)

### 2.5 Application des Styles
- `borderRadius`: Aléatoire entre '0px' et '50%'
- `hoverScale`: 1.05 pour interactivité
- `boxShadow`: Ombre dure pour contraste

---

## Phase 3 - Export JSON

Retourne l'objet `Block[]` JSON valide, prêt à être injecté dans `artist_page.desktop_layout`.

Format attendu :
```json
[
  { "id": "...", "type": "artistName", "x": 50, "y": 200, ... },
  { "id": "...", "type": "oeuvre", "x": 20, "y": 350, ... }
]
```
