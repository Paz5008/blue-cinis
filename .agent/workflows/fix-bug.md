---
description: Workflow de reproduction et correction de bug
---

## 1. Reproduction
- Demande les étapes pour reproduire le bug (ou l'URL concernée)
- Utilise le navigateur pour exécuter ces étapes et capturer les logs de la console et une vidéo de l'erreur

## 2. Investigation
- Si l'erreur semble venir des données, utilise Prisma MCP pour inspecter les tables concernées
- Si c'est un problème de rendu, analyse le composant React concerné
- Vérifie les logs serveur si nécessaire

## 3. Correction & Vérification
- Applique le correctif
- Relance le scénario de test dans le navigateur
- Génère un artefact "Preuve de correction" (Vidéo ou Screenshot)
