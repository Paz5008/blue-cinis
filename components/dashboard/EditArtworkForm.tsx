"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface ArtworkData {
  id: string;
  title: string;
  price: number | null;
  year: number | null;
  dimensions: string | null;
  description: string | null;
  categoryId: string | null;
  imageUrl: string | null;
}

interface EditArtworkFormProps {
  initialData: ArtworkData;
  categories: Category[];
}

export default function EditArtworkForm({ initialData, categories }: EditArtworkFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title || "");
  const [price, setPrice] = useState<string>(initialData.price?.toString() || "");
  const [year, setYear] = useState<string>(initialData.year?.toString() || "");
  const [dimensions, setDimensions] = useState(initialData.dimensions || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialData.categoryId || "");
  const [previewSrc, setPreviewSrc] = useState<string | null>(initialData.imageUrl || null);
  const [errors, setErrors] = useState<{ title?: string; categoryId?: string }>({});
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function validateTitle() {
    if (!title.trim()) {
      setErrors(prev => ({ ...prev, title: "Le titre est requis" }));
      return false;
    }
    setErrors(prev => {
      const { title: _removedTitle, ...rest } = prev;
      return rest;
    });
    return true;
  }

  function validateCategory() {
    if (!selectedCategoryId) {
      setErrors(prev => ({ ...prev, categoryId: "La catégorie est requise" }));
      return false;
    }
    setErrors(prev => {
      const { categoryId: _removedCategory, ...rest } = prev;
      return rest;
    });
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateTitle() || !validateCategory()) return;
    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", price);
      formData.append("year", year);
      formData.append("dimensions", dimensions);
      formData.append("description", description);
      formData.append("categoryId", selectedCategoryId);
      // Important: envoyer l'URL de l'image si elle a été modifiée sans upload de fichier
      formData.append("imageUrl", previewSrc || "");
      const res = await fetch(`/api/artist/artworks/${initialData.id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        setMessage("Œuvre mise à jour avec succès !");
        router.push("/dashboard-artist/artworks");
      } else {
        const data = await res.json();
        setMessage(data.error?.message || "Erreur lors de la mise à jour.");
      }
    } catch (error: any) {
      setMessage(error.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {message && <p className="text-green-600">{message}</p>}
      {/* Titre */}
      <div>
        <label className="block font-medium mb-1">Titre</label>
        <input
          type="text"
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={validateTitle}
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
      </div>
      {/* Prix */}
      <div>
        <label className="block font-medium mb-1">Prix (en €)</label>
        <input
          type="number"
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>
      {/* Année */}
      <div>
        <label className="block font-medium mb-1">Année</label>
        <input
          type="number"
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
          value={year}
          onChange={e => setYear(e.target.value)}
        />
      </div>
      {/* Dimensions */}
      <div>
        <label className="block font-medium mb-1">Dimensions</label>
        <input
          type="text"
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
          value={dimensions}
          onChange={e => setDimensions(e.target.value)}
        />
      </div>
      {/* Description */}
      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
        />
      </div>
      {/* Catégorie */}
      <div>
        <label className="block font-medium mb-1">Catégorie</label>
        <select
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
          value={selectedCategoryId}
          onChange={e => setSelectedCategoryId(e.target.value)}
          onBlur={validateCategory}
        >
          <option value="">-- Sélectionner --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>}
      </div>
      {/* Image via URL */}
      <div>
        <label className="block font-medium mb-1">URL de l'image</label>
        <input
          type="text"
          value={previewSrc || ''}
          placeholder="https://exemple.com/mon-image.jpg"
          onChange={e => setPreviewSrc(e.target.value.trim())}
          className="w-full p-2 border rounded bg-[var(--dash-input-bg)] text-[var(--dash-input-text)] border-[var(--dash-sidebar-border)]"
        />
        {previewSrc && (
          <img src={previewSrc} alt="Preview" className="mt-2 h-40 object-cover rounded" />
        )}
      </div>
      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Mettre à jour'}
        </button>
      </div>
    </form>
  );
}
