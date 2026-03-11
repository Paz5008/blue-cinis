# 🧠 Guide Stratégique: NotebookLM "Ultra" Prompts pour Blue Cinis V.1

Ce document contient des "Super-Prompts" conçus spécifiquement pour exploiter la fenêtre de contexte massive de NotebookLM (Gemini 1.5 Pro).
**Prérequis :** Avoir uploadé le fichier `LOIRE_GALLERY_FULL_CONTEXT.txt` dans ta source NotebookLM.

---

## 🏗️ Phase 1 : Audit Structurel & "Health Check"
*Objectif : Identifier les fondations pourries avant de construire la V.1.*

### 1. Le "Crash Test" CTO
> **Prompt :**
> "Agis en tant que CTO intransigeant auditant une startup avant rachat. Analyse l'intégralité du code fourni.
> Je veux un rapport brutal et honnête sur l'état du projet 'Blue Cinis'.
>
> Structure ta réponse ainsi :
> 1. **Score de Crédibilité (0-100)** : Le code est-il professionnel ou amateur ?
> 2. **Les 3 "Deal Breakers"** : Les failles architecturales majeures qui empêchent un lancement public (Sécurité, Performance, Data intégrité).
> 3. **Dette Technique Cachée** : Liste les fichiers où le code est trop complexe, mal typé ou dupliqué.
> 4. **Verdict** : Est-on prêt pour la V.1 ou faut-il une refonte ?"

### 2. Audit de Sécurité (Spécial Next.js/Prisma)
> **Prompt :**
> "Agis en tant qu'Expert Cybersécurité spécialisé en Next.js. Scanne le code pour trouver des vulnérabilités.
> Concentre-toi sur :
> - **Server Actions** : Est-ce que toutes les mutations de données vérifient bien l'authentification ET l'autorisation (rôles) ? Cite les fichiers suspects.
> - **Fuites de Données** : Est-ce que des données sensibles (emails, téléphones, hash) risquent d'être envoyées au client (dans les `console.log` ou les props React) ?
> - **Injections** : Vérifie l'utilisation de `dangerouslySetInnerHTML` ou des requêtes raw SQL si elles existent."

---

## 🎨 Phase 2 : Perfectionnement UX & UI
*Objectif : Assurer que l'expérience utilisateur est fluide et premium.*

### 3. Le Chasseur d'Incohérences Visuelles
> **Prompt :**
> "Analyse tous les fichiers `tsx` et `css`. Identifie les incohérences dans le Design System.
> - Est-ce qu'on utilise des valeurs 'magiques' (ex: `px`, `colors`) au lieu des classes Tailwind standards ou des variables CSS ?
> - Liste les composants qui semblent être des doublons ou qui font la même chose avec un style légèrement différent.
> - Vérifie la responsive : Y a-t-il des composants où les classes `md:` ou `lg:` semblent manquantes pour le mobile ?"

### 4. Simulation de Parcours Utilisateur (QA Virtuel)
> **Prompt :**
> "Simule le parcours d'un **Artiste** qui s'inscrit pour la première fois.
> En lisant le code des formulaires (`RegistrationHub`, `ArtistProfile`, etc.) et des API routes associées :
> 1. Décris étape par étape ce qui se passe techniquement.
> 2. Identifie les "trous noirs" : Où l'utilisateur risque-t-il d'être bloqué sans message d'erreur clair ? (ex: upload image échoue, sauvegarde network error).
> 3. Propose 3 améliorations UX immédiates pour ce flow d'inscription (`loading states`, `feedbacks`, `redirections`)."

---

## ⚙️ Phase 3 : Logique Métier & Backend
*Objectif : Solidifier le code qui gère l'argent et les données.*

### 5. L'Inspecteur de la Base de Données
> **Prompt :**
> "Croise les informations entre `schema.prisma` et le code de l'application (`/app`, `/lib`).
> 1. Y a-t-il des champs dans la base de données qui ne sont **JAMAIS** utilisés ou lus dans le code ? (Code mort).
> 2. Y a-t-il des opérations lourdes (boucles dans des boucles, requêtes N+1) détectables dans les `Server Components` ou les API routes ? Cite les fichiers à optimiser d'urgence.
> 3. Vérifie la logique des 'Status' (Commandes, Réservations). La machine à état est-elle robuste ou peut-on passer d'un état 'Annulé' à 'Payé' par erreur ?"

### 6. Le Rédacteur de Tests (TDD à postériori)
> **Prompt :**
> "Je dois écrire des tests E2E avec Playwright pour valider la V.1.
> Analyse les fonctionnalités critiques du `Dashboard Artiste`.
> Génère-moi la liste des 10 scénarios de tests **indispensables** à automatiser (Happy Path + Edge Cases).
> Pour chaque scénario, décris les étapes : 'L'utilisateur clique sur X, le système doit vérifier Y en base de données'."

---

## 🚀 Phase 4 : La "Golden Copy" V.1
*Objectif : Le polissage final.*

### 7. Le Générateur de Roadmap V.1
> **Prompt :**
> "Synthèse Finale. Base-toi sur tout le code analysé.
> Construis-moi le **Plan d'Action V.1 Official**.
> Classe les tâches en 3 catégories :
> 1. **🔴 BLOQUANT (Must Fix)** : Bugs, failles sécu, fonctionnalités cassées.
> 2. **🟡 IMPORTANT (Should Fix)** : Refactoring, Nettoyage code mort, Performance.
> 3. **🟢 FINITION (Polish)** : Animations, Textes, SEO, Accessibilité.
>
> Pour chaque tâche, donne-moi le niveau de complexité estimé (Faible/Moyen/Élevé) et le fichier principal concerné."

### 8. Le Spécialiste SEO & Marketing
> **Prompt :**
> "Analyse les pages publiques (`page.tsx`, `layout.tsx`).
> - Le SEO est-il bien implémenté ? (Metadata dynamiques, OpenGraph, Alt text sur images).
> - Les textes (copywriting) dans les composants sont-ils engageants ou 'lorem ipsum' / placeholders ?
> - Suggère 5 améliorations techniques rapides pour booster le score Lighthouse (Core Web Vitals) basé sur ce que tu vois du code (images, scripts, polices)."

---

## 💡 Conseil Pro pour NotebookLM
Une fois que tu as posé une question, **continue la conversation** !
*   *Exemple :* Si il te dit "Il y a une faille dans `auth.ts`", réponds : **"Ok, génère-moi le code corrigé pour `auth.ts` en expliquant chaque changement."**
*   C'est là que tu gagnes un temps fou : il te donne la solution, tu n'as plus qu'à vérifier et coller.
