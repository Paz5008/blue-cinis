---
description: Exécution des tests E2E Playwright
---

1. Vérifie que le serveur de dev est actif (port 3000)

2. Exécute les tests E2E
```bash
npm run test:e2e
```

3. Si des tests échouent :
   - Analyse le rapport dans `playwright-report/`
   - Capture les screenshots des échecs
   - Propose des corrections

4. Pour le mode interactif (debug) :
```bash
npx playwright test --ui
```
