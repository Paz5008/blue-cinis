---
description: 2ème étape de création de preset
---

Génère un script TypeScript temporaire (exécutable via `ts-node` ou dans le navigateur) pour créer un preset "Nuage Éclaté".

## 1. Configuration de la "Vibe"
Au lieu de valeurs fixes, utilise des plages aléatoires basées sur une ambiance "Organique & Brute" :
*   **Palette :** Pioche aléatoirement dans les couleurs de `themeTokens.ts` pour les backgrounds.
*   **Rotation :** Varie fortement entre -15 et +15 degrés pour casser la grille [4].
*   **Profondeur :** Assigne des `zIndex` aléatoires (1 à 10) pour créer des superpositions intéressantes.

## 2. L'Algorithme Mathématique (Sans Moteur Physique)
Crée une fonction `generateScatterLayout()` qui :
1.  **Instancie la liste :**
    *   1 `artistName` (taille énorme, zIndex max).
    *   3 `artwork` (tailles variées : 1 grand, 2 moyens).
    *   2 `sticker` (petits éléments décoratifs, rotation forte).
    *   2 `text` (courts extraits).

2.  **Positionnement "Nuage" :**
    *   Place le `artistName` au centre (50%, 50%) comme ancre.
    *   Pour les autres, génère une position polaire (angle aléatoire 0-360°, distance aléatoire du centre) et convertis-la en coordonnée cartésienne (x, y %).

3.  **Résolution de Conflits (AABB Smart) :**
    *   Vérifie si le bloc chevauche un autre bloc existant.
    *   Si chevauchement > 10% (on tolère un léger overlap artistique), repousse le bloc vers l'extérieur du cercle jusqu'à ce qu'il soit libre.

4.  **Application du Style (L'Inspecteur) :**
    *   Applique des propriétés de `BlockStyle` [3] :
        *   `borderRadius`: Aléatoire entre '0px' (brut) et '50%' (cercle) selon le type.
        *   `hoverScale`: 1.05 pour inviter au clic.
        *   `boxShadow`: Utilise une ombre portée dure ("hard shadow") pour le contraste.
