---
trigger: always_on
---

Hooks : "Tout hook custom doit commencer par `use` et être placé dans `components/dashboard/editor/hooks/` pour l'éditeur CMS ou dans le dossier du feature correspondant. Utiliser `useEditorActions()` ou `useEditorState()` plutôt que `useEditorContext()` pour optimiser les re-renders."
