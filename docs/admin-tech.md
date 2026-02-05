# Administration technique – exploitation Loire Gallery

Dernière mise à jour : février 2025. Ce guide complète la console `/admin/tech` et documente les scripts disponibles, la cartographie des tags Next.js ainsi que les procédures de reprise pour les exports lourds.

---

## 1. Scripts de revalidation

| Script (`scriptId`) | Portée | Tags purgés | Pages relancées | Notes / API |
| --- | --- | --- | --- | --- |
| `artists-refresh` | Bannières artistes + homepage | `artists`, `artists-list`, `featured-artists`, `artist-posters`, `newest-artists` | `/`, `/artistes` | UI : bouton « Artistes & homepage »<br/>API : `curl -XPOST /api/admin/maintenance/revalidate -d '{"scriptId":"artists-refresh"}'` |
| `inventory-refresh` | Galerie & variantes | `gallery-list`, `featured-artworks` | `/galerie` | À lancer après une mise à jour massive d’œuvres ou de variantes. |
| `events-refresh` | Agenda | `upcoming-events` | `/evenements` | Utilisé lors de la création/suppression d’évènements. |
| `full-refresh` | Purge globale | tous les tags ci-dessus | `/`, `/artistes`, `/galerie`, `/evenements` | À réserver aux incidents (cache corrompu, rollback). |

**Procédure :**

1. Ouvrir `/admin/tech`, section « Scripts de revalidation ».
2. Cliquer sur *Lancer* pour le script visé ou appeler l’API ci-dessus.
3. Vérifier le badge « Exécuté le … » et contrôler rapidement la page concernée.
4. En cas d’échec, un log `cache.revalidate.script` est ajouté au journal d’audit.

---

## 2. Tags de cache centralisés

| Tag | Description | Déclencheurs principaux |
| --- | --- | --- |
| `artists` | Cache partagé des données artistes (home, carrousels). | Publication d’un profil ou webhook Stripe (nouvelle commande). |
| `artists-list` | Listing `/artistes`. | Activations / désactivations d’artistes. |
| `featured-artists` | Bannière « Artistes mis en avant ». | CMS bannière, webhook de commande. |
| `artist-posters` | Posters/bannières personnalisées. | API `/api/artist/customization/[key]`. |
| `newest-artists` | Bloc « Nouveaux talents » home. | Création artiste, webhook commande. |
| `gallery-list` | Galerie publique + inventaire. | CRUD œuvres, variantes, réservations. |
| `featured-artworks` | Sélection « À la une ». | Promotions, webhook commande. |
| `upcoming-events` | Agenda évènements. | API `/api/admin/events`. |

Tous ces tags sont définis dans `src/lib/cacheTags.ts` et consommés par les APIs/admin scripts. Toute nouvelle surface publique doit y référencer son tag avant d’appeler `revalidateTag`.

---

## 3. Exports lourds en arrière-plan

Les exports CSV (Leads & Commandes) utilisent la table `AdminExportJob` :

1. **pending** : job créé instantanément, réponse envoyée au client.
2. **processing** : le worker in-process assemble le CSV (limite 5 000 lignes).
3. **ready** : fichier disponible via `/api/admin/exports/:id/download`.
4. **error** : message stocké dans `errorMessage`, log `orders.export.async`/`leads.export.async`.

### Bonnes pratiques

- Déclencher un export depuis `/admin/leads` ou `/admin/orders`, puis surveiller `/admin/tech`.
- Utiliser le bouton *Rafraîchir* pour recharger les jobs (limités aux 6 derniers).
- En cas d’erreur, relancer l’export après vérification des filtres. Les jobs échoués restent dans l’historique pour audit.
- API de suivi : `GET /api/admin/exports?type=leads_csv&limit=5`.

### Stockage & fichiers temporaires

- Les jobs `AdminExportJob` poussent les CSV sur Cloudinary (`resource_type=raw`) quand `ADMIN_EXPORT_STORAGE_PROVIDER=cloudinary` et `CLOUDINARY_*` sont fournis. Sinon, ils retombent sur `tmp/admin-exports/<jobId>/...`.
- Le dossier `tmp/admin-exports` est ignoré par Git ; pensez à le purger ponctuellement (`rm -rf tmp/admin-exports/*`) si vous générez beaucoup de fichiers.
- Les champs `fileStorageProvider`, `fileStorageKey`, `fileChecksum` permettent de retracer un export et sont utilisés par l’API `GET /api/admin/exports/:id/download`.

---

## 4. Playbooks / reprise

| Scénario | Action |
| --- | --- |
| Mise à jour massive (artistes + œuvres) | `full-refresh`, puis contrôler `/`, `/galerie`, `/artistes`. |
| Suppression d’un évènement | `events-refresh`. Vérifier `/evenements`. |
| Export bloqué en `processing` > 5 min | Vérifier logs server (`orders.export.async`). Si besoin, supprimer le job via DB et relancer. |
| Cache incohérent après incident | Exécuter `full-refresh`, puis `npm run health` pour s’assurer que la base répond. |
| Surconsommation Stripe webhook | Vérifier `/admin/webhooks`, filtrer sur `provider=stripe`, rejouer via bouton « Rejouer ». |

---

## 5. Références rapides

- Console : `/admin/tech`
- API scripts : `POST /api/admin/maintenance/revalidate`
- Table jobs : `AdminExportJob` (Prisma)
- Doc nav : `docs/admin-tech.md` (ce fichier)
- Contact d’astreinte : Slack `#ops-loire`

Contribuer : mettre à jour `src/lib/cacheTags.ts` (nouvelles surfaces), `app/admin/tech/_components/TechOpsClient.tsx` pour l’UI, et incrémenter cette documentation.
