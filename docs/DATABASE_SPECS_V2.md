# SPÉCIFICATIONS TECHNIQUES BDD : PROJET BLUE CINIS

## 1. Cœur du Système : CMS & Design
Cette section gère l'affichage personnalisé et les assets.

### artist_page
Table stockant la configuration de la page d'accueil de l'artiste.

*   `id` : Integer (PK)
*   `artist_profile_id` : Integer (FK -> artist_profile.id)
*   `slug` : String (Unique, ex: "jean-michel-basquiat")
*   `desktop_layout` : JSONB ⚠ Structure (Array d'objets) contenant les coordonnées X/Y, dimensions et Z-index pour la version Desktop.
*   `mobile_layout` : JSONB ⚠ Structure indépendante pour la version Mobile.
*   `global_styles` : JSONB Configuration globale (Palette de couleurs, Fonts, Background).
*   `is_published` : Boolean Permet de sauvegarder sans mettre en ligne.
*   `updated_at` : Timestamp

### media_library
Table centrale pour tous les fichiers (images œuvres, photos profil, éléments déco du CMS).

*   `id` : Integer (PK)
*   `user_id` : Integer (FK -> user.id) Celui qui a uploadé le fichier.
*   `file_url` : String URL distante (S3, Cloudinary, etc.).
*   `file_type` : String MIME type (ex: 'image/webp').
*   `alt_text` : String SEO & Accessibilité.
*   `width` : Integer
*   `height` : Integer
*   `size_kb` : Integer Poids du fichier.
*   `created_at` : Timestamp

## 2. Identité & Utilisateurs
Structure simplifiée : 1 User = 1 Profil.

### user
Table d'authentification.

*   `id` : Integer (PK)
*   `email` : String (Unique)
*   `password` : String (Hash)
*   `role` : Enum ('admin', 'artist', 'buyer')
*   `created_at` : Timestamp
*   `password_reset_token` : String (Nullable)

### artist_profile
Table publique de l'artiste.

*   `id` : Integer (PK)
*   `user_id` : Integer (FK -> user.id, Unique/One-to-One)
*   `profile_image_id` : Integer (FK -> media_library.id)
*   `bio` : Text
*   `location` : String
*   `stripe_account_id` : String Pour les virements vers l'artiste.
*   `social_links` : JSONB { "instagram": "url", "tiktok": "url" }
*   `created_at` : Timestamp

## 3. Catalogue Œuvres
Produits vendables.

### artwork
*   `id` : Integer (PK)
*   `artist_profile_id` : Integer (FK -> artist_profile.id)
*   `media_library_id` : Integer (FK -> media_library.id) ⚠ Image principale.
*   `title` : String
*   `description` : Text
*   `price` : Decimal
*   `year` : Integer
*   `dimensions` : String
*   `medium` : String
*   `category_id` : Integer (FK -> category.id)
*   `status` : Enum ('available', 'sold', 'archived')
*   `created_at` : Timestamp

### category
*   `id` : Integer (PK)
*   `name` : String

## 4. E-commerce & Social
Ces tables restent similaires à ta base initiale, mais mises à jour avec les nouvelles clés.

### order
*   `id` : Integer (PK)
*   `user_id` : Integer (FK -> user.id) L'acheteur.
*   `artist_profile_id` : Integer (FK -> artist_profile.id) Le vendeur.
*   `artwork_id` : Integer (FK -> artwork.id)
*   `amount` : Decimal
*   `commission_amount` : Decimal
*   `stripe_transaction_id` : String
*   `status` : String
*   `created_at` : Timestamp

### comment / like / wishlist
Lien standard vers user_id et artwork_id.

### follower
*   `user_id` : Integer (FK -> user.id) Le fan.
*   `artist_profile_id` : Integer (FK -> artist_profile.id) L'artiste suivi.

## 5. IA & Agents (Optionnel/Futur)
Structure conservée pour le chat IA.

### agent_conversation
*   `id` : Integer (PK)
*   `user_id` : Integer (FK -> user.id)
*   `title` : String
*   `updated_at` : Timestamp

### agent_message
*   `id` : Integer (PK)
*   `conversation_id` : Integer (FK -> agent_conversation.id)
*   `role` : Enum ('user', 'assistant')
*   `content` : JSONB

---

## 💡 Note pour le développeur (Implémentation du CMS)
Pour gérer le "Desktop Layout" vs "Mobile Layout" en JSONB, je recommande une structure de bloc standardisée :

```json
[
  // Exemple d'objet stocké dans "desktop_layout"
  {
    "id": "block_unique_id_123",
    "type": "image",
    "data": {
       "media_id": 45, 
       "link": null // Référence à media_library
    },
    "style": {
      "position": "absolute",
      "top": 100, 
      "left": 50,
      "width": 300,
      "height": "auto",
      "zIndex": 10,
      "rotation": 0 // Pixels ou %
    }
  }
]
```
Cela permettra au front-end de mapper facilement ces données sur des composants React/Vue positionnés en absolu.
