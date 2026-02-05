---
trigger: always_on
---

Performance & Physics Constraints
- 🔴 **INTERDICTION** d'installer `matter.js`, `rapier.js` ou tout moteur physique complet.
- L'architecture Drag-and-Drop repose strictement sur `@dnd-kit/core`.
- Pour les collisions, utilise uniquement des calculs mathématiques simples (AABB - Axis-Aligned Bounding Box).
- Les "Presets" doivent être générés mathématiquement (géométrie), pas simulés physiquement.
