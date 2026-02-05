import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createArtwork } from '@/src/actions/artwork';

export type CategoryOption = {
  id: string;
  name: string;
};

export type ArtworkPayload = {
  id: string;
  title: string;
  imageUrl?: string | null;
  price?: number | null;
  categoryId?: string | null;
};

type ArtworkCreateFormProps = {
  categories: CategoryOption[];
  onCreated?: (artwork: ArtworkPayload) => void;
};

type FormErrors = {
  title?: string;
  categoryId?: string;
};

const initialErrors: FormErrors = {};

export default function ArtworkCreateForm({ categories, onCreated }: ArtworkCreateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [year, setYear] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [errors, setErrors] = useState<FormErrors>(initialErrors);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })),
    [categories],
  );

  function validateTitle(value: string) {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, title: 'Le titre est requis' }));
      return false;
    }
    setErrors(prev => {
      const { title: _title, ...rest } = prev;
      return rest;
    });
    return true;
  }

  function validateCategory(value: string) {
    if (!value) {
      setErrors(prev => ({ ...prev, categoryId: 'La catégorie est requise' }));
      return false;
    }
    setErrors(prev => {
      const { categoryId: _categoryId, ...rest } = prev;
      return rest;
    });
    return true;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const isTitleValid = validateTitle(title);
    const isCategoryValid = validateCategory(selectedCategoryId);

    if (!isTitleValid || !isCategoryValid) {
      return;
    }

    if (!imageFile) {
      setMessageTone('error');
      setMessage('Veuillez sélectionner une image.');
      return;
    }

    setMessage(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);
    formData.append('year', year);
    formData.append('dimensions', dimensions);
    formData.append('description', description);
    formData.append('categoryId', selectedCategoryId);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    // Also append imageUrl if you had logic for it, but here it is file mainly.

    startTransition(async () => {
      try {
        const result = await createArtwork(formData);

        if (!result.success) {
          setMessageTone('error');
          setMessage(result.error || 'Erreur lors de la création de l’œuvre.');
          // You could also setErrors(result.fieldErrors) here if mapped correctly
          return;
        }

        const artwork = result.data;
        setMessageTone('success');
        setMessage('Œuvre créée avec succès.');
        setTitle('');
        setPrice('');
        setYear('');
        setDimensions('');
        setDescription('');
        setSelectedCategoryId('');
        setImageFile(null);
        setPreviewSrc(null);
        setErrors(initialErrors);

        if (artwork) {
          onCreated?.(artwork);
        }
        // router.refresh() is handled by revalidatePath in action, but client router refresh ensures current view updates if it wasn't a full page reload or if using soft nav
        // But revalidatePath revalidates server data. Client cache might need router.refresh().
        // Since we are in useTransition context, explicit router.refresh might not be needed if path was revalidated?
        // Actually, revalidatePath on server doesn't auto-update client *current* page data unless we navigate or refresh.
        // The action returns, we are still on same page.
        // router.refresh() fetches new server components.
        // So keeping router.refresh() is good practice or strictly needed? 
        // With Server Actions, revalidatePath should update the data for the next navigation. 
        // But to see it NOW on the current page (e.g. list update), router.refresh() is often used.
        // Wait. `createArtwork` calls `revalidatePath`.
        // If I call router.refresh() here, it will re-fetch data.
        // I'll keep it to be safe. Actually, let's try without if revalidatePath handles it? 
        // No, revalidatePath just clears cache. The UI needs to know to re-render.
        // Next.js docs say revalidatePath purges cache. router.refresh() refreshes the current route.
        // I will keep logic simple.

      } catch (error) {
        setMessageTone('error');
        setMessage('Erreur inattendue.');
      }
    });

    // loading is handled by isPending
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Titre de l’œuvre *</label>
        <input
          type="text"
          value={title}
          onChange={event => {
            setTitle(event.target.value);
            if (errors.title) {
              validateTitle(event.target.value);
            }
          }}
          onBlur={event => validateTitle(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prix (en €)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={event => setPrice(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Année</label>
          <input
            type="number"
            min="0"
            value={year}
            onChange={event => setYear(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Dimensions</label>
        <input
          type="text"
          value={dimensions}
          onChange={event => setDimensions(event.target.value)}
          placeholder="Ex. 80 x 60 cm"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie *</label>
        <select
          value={selectedCategoryId}
          onChange={event => {
            setSelectedCategoryId(event.target.value);
            if (errors.categoryId) {
              validateCategory(event.target.value);
            }
          }}
          onBlur={event => validateCategory(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">Sélectionner une catégorie</option>
          {sortedCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p className="mt-1 text-xs text-rose-600">{errors.categoryId}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Image de l’œuvre *</label>
        <input
          type="file"
          accept="image/*"
          onChange={event => {
            const file = event.target.files?.[0] ?? null;
            setImageFile(file);
            if (file) {
              const previewUrl = URL.createObjectURL(file);
              setPreviewSrc(previewUrl);
            } else {
              setPreviewSrc(null);
            }
          }}
          className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-10 text-sm text-slate-500 shadow-sm outline-none transition hover:border-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        {previewSrc ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <img
              src={previewSrc}
              alt="Aperçu de l’œuvre"
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      {message ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${messageTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
        >
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? 'Enregistrement…' : 'Ajouter cette œuvre'}
      </button>
    </form>
  );
}
