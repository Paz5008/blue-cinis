'use client';

import { useState, useEffect, useTransition } from 'react';
import { X, Bell, Loader2 } from 'lucide-react';
import type { ArtAlert } from '@prisma/client';
import { createAlert, updateAlert, type AlertFormData } from '@/src/actions/alerts';
import toast from 'react-hot-toast';

type Props = {
    open: boolean;
    onClose: () => void;
    alert?: ArtAlert | null;
    artists: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    onSuccess: () => void;
};

const STYLES = [
    { value: 'abstract', label: 'Abstrait' },
    { value: 'figurative', label: 'Figuratif' },
    { value: 'minimalist', label: 'Minimaliste' },
    { value: 'expressionist', label: 'Expressionniste' },
    { value: 'surrealist', label: 'Surréaliste' },
    { value: 'impressionist', label: 'Impressionniste' },
    { value: 'contemporary', label: 'Contemporain' },
];

const MEDIUMS = [
    { value: 'oil', label: 'Huile' },
    { value: 'acrylic', label: 'Acrylique' },
    { value: 'watercolor', label: 'Aquarelle' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'mixed-media', label: 'Techniques mixtes' },
    { value: 'photography', label: 'Photographie' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'digital', label: 'Art numérique' },
];

const FREQUENCIES = [
    { value: 'immediate', label: 'Immédiat', desc: 'Notification dès qu\'une œuvre correspond' },
    { value: 'daily', label: 'Quotidien', desc: 'Résumé une fois par jour' },
    { value: 'weekly', label: 'Hebdomadaire', desc: 'Résumé une fois par semaine' },
];

export default function AlertFormDialog({
    open,
    onClose,
    alert,
    artists,
    categories,
    onSuccess,
}: Props) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!alert;

    // Form state
    const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
    const [priceMin, setPriceMin] = useState<string>('');
    const [priceMax, setPriceMax] = useState<string>('');
    const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate');
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [pushEnabled, setPushEnabled] = useState(false);

    // Reset form on open/close or alert change
    useEffect(() => {
        if (open && alert) {
            setSelectedArtists(alert.artistIds);
            setSelectedCategories(alert.categoryIds);
            setSelectedStyles(alert.styles);
            setSelectedMediums(alert.mediums);
            setPriceMin(alert.priceMin ? String(alert.priceMin / 100) : '');
            setPriceMax(alert.priceMax ? String(alert.priceMax / 100) : '');
            setFrequency(alert.frequency as 'immediate' | 'daily' | 'weekly');
            setEmailEnabled(alert.emailEnabled);
            setPushEnabled(alert.pushEnabled);
        } else if (open) {
            setSelectedArtists([]);
            setSelectedCategories([]);
            setSelectedStyles([]);
            setSelectedMediums([]);
            setPriceMin('');
            setPriceMax('');
            setFrequency('immediate');
            setEmailEnabled(true);
            setPushEnabled(false);
        }
    }, [open, alert]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData: AlertFormData = {
            artistIds: selectedArtists,
            categoryIds: selectedCategories,
            styles: selectedStyles,
            mediums: selectedMediums,
            priceMin: priceMin ? Math.round(parseFloat(priceMin) * 100) : null,
            priceMax: priceMax ? Math.round(parseFloat(priceMax) * 100) : null,
            frequency,
            emailEnabled,
            pushEnabled,
        };

        startTransition(async () => {
            const result = isEdit
                ? await updateAlert(alert!.id, formData)
                : await createAlert(formData);

            if (result.success) {
                toast.success(isEdit ? 'Alerte mise à jour' : 'Alerte créée');
                onSuccess();
                onClose();
            } else {
                toast.error(result.error);
            }
        });
    };

    const toggleSelection = (
        value: string,
        selected: string[],
        setSelected: (v: string[]) => void
    ) => {
        if (selected.includes(value)) {
            setSelected(selected.filter((v) => v !== value));
        } else {
            setSelected([...selected, value]);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-dialog-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0a0a] shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Bell className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        </div>
                        <h2 id="alert-dialog-title" className="text-lg font-medium text-white">
                            {isEdit ? 'Modifier l\'alerte' : 'Créer une alerte'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Styles */}
                    <fieldset>
                        <legend className="text-sm font-medium text-white/80 mb-2">Styles</legend>
                        <div className="flex flex-wrap gap-2">
                            {STYLES.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => toggleSelection(value, selectedStyles, setSelectedStyles)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedStyles.includes(value)
                                            ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {/* Mediums */}
                    <fieldset>
                        <legend className="text-sm font-medium text-white/80 mb-2">Techniques</legend>
                        <div className="flex flex-wrap gap-2">
                            {MEDIUMS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => toggleSelection(value, selectedMediums, setSelectedMediums)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedMediums.includes(value)
                                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {/* Price Range */}
                    <fieldset>
                        <legend className="text-sm font-medium text-white/80 mb-2">Fourchette de prix (€)</legend>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                placeholder="Min"
                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                            />
                            <span className="text-white/40">–</span>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                placeholder="Max"
                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                            />
                        </div>
                    </fieldset>

                    {/* Artists (if available) */}
                    {artists.length > 0 && (
                        <fieldset>
                            <legend className="text-sm font-medium text-white/80 mb-2">Artistes</legend>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {artists.map(({ id, name }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleSelection(id, selectedArtists, setSelectedArtists)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedArtists.includes(id)
                                                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                                                : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    {/* Categories (if available) */}
                    {categories.length > 0 && (
                        <fieldset>
                            <legend className="text-sm font-medium text-white/80 mb-2">Catégories</legend>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(({ id, name }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleSelection(id, selectedCategories, setSelectedCategories)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategories.includes(id)
                                                ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                                                : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    {/* Frequency */}
                    <fieldset>
                        <legend className="text-sm font-medium text-white/80 mb-2">Fréquence</legend>
                        <div className="space-y-2">
                            {FREQUENCIES.map(({ value, label, desc }) => (
                                <label
                                    key={value}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${frequency === value
                                            ? 'bg-white/10 border border-white/20'
                                            : 'bg-white/5 border border-white/10 hover:border-white/15'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="frequency"
                                        value={value}
                                        checked={frequency === value}
                                        onChange={() => setFrequency(value as 'immediate' | 'daily' | 'weekly')}
                                        className="mt-0.5 accent-emerald-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">{label}</p>
                                        <p className="text-xs text-white/50">{desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {/* Notifications */}
                    <fieldset>
                        <legend className="text-sm font-medium text-white/80 mb-2">Notifications</legend>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailEnabled}
                                    onChange={(e) => setEmailEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded accent-emerald-500"
                                />
                                <span className="text-sm text-white/80">Email</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pushEnabled}
                                    onChange={(e) => setPushEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded accent-emerald-500"
                                />
                                <span className="text-sm text-white/80">Push (bientôt disponible)</span>
                            </label>
                        </div>
                    </fieldset>

                    {/* Submit */}
                    <div className="pt-4 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white text-black font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                            {isEdit ? 'Mettre à jour' : 'Créer l\'alerte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
