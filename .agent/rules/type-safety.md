---
trigger: always_on
---

Type Safety : "Éviter `as any`. Utiliser les type guards de `types/cms.ts` (`isTextBlock`, `isImageBlock`, `isGalleryBlock`, etc.) pour le type narrowing. Pour les blocs avec children/columns, typer explicitement plutôt que cast."
