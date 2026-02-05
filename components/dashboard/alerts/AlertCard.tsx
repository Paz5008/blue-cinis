'use client';

import { useState, useTransition } from 'react';
import { Bell, BellOff, Pencil, Trash2, X, Check } from 'lucide-react';
import type { ArtAlert } from '@prisma/client';
import { toggleAlertActive, deleteAlert } from '@/src/actions/alerts';
import toast from 'react-hot-toast';

type Props = {
    alert: ArtAlert;
    onEdit: (alert: ArtAlert) => void;
    onDeleted: (id: string) => void;
};

const STYLE_LABELS: Record<string, string> = {
    abstract: 'Abstrait',
    figurative: 'Figuratif',
    minimalist: 'Minimaliste',
    expressionist: 'Expressionniste',
    surrealist: 'Surréaliste',
    impressionist: 'Impressionniste',
    contemporary: 'Contemporain',
};

const MEDIUM_LABELS: Record<string, string> = {
    oil: 'Huile',
    acrylic: 'Acrylique',
    watercolor: 'Aquarelle',
    pastel: 'Pastel',
    'mixed-media': 'Techniques mixtes',
    photography: 'Photographie',
    sculpture: 'Sculpture',
    digital: 'Art numérique',
};

const FREQUENCY_LABELS: Record<string, string> = {
    immediate: 'Immédiat',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
};

function formatPrice(cents: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

export default function AlertCard({ alert, onEdit, onDeleted }: Props) {
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleAlertActive(alert.id);
            if (!result.success) {
                toast.error(result.error);
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm('Supprimer cette alerte ?')) return;
        setIsDeleting(true);
        const result = await deleteAlert(alert.id);
        if (result.success) {
            onDeleted(alert.id);
            toast.success('Alerte supprimée');
        } else {
            toast.error(result.error);
            setIsDeleting(false);
        }
    };

    const hasCriteria =
        alert.artistIds.length > 0 ||
        alert.categoryIds.length > 0 ||
        alert.styles.length > 0 ||
        alert.mediums.length > 0 ||
        alert.priceMin !== null ||
        alert.priceMax !== null;

    return (
        <div
            className={`relative rounded-xl border p-5 transition-all duration-300 ${alert.isActive
                    ? 'border-white/15 bg-white/5'
                    : 'border-white/8 bg-white/[0.02] opacity-60'
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${alert.isActive ? 'bg-emerald-500/20' : 'bg-white/5'
                            }`}
                    >
                        {alert.isActive ? (
                            <Bell className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        ) : (
                            <BellOff className="w-4 h-4 text-white/40" aria-hidden="true" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {FREQUENCY_LABELS[alert.frequency] || alert.frequency}
                        </p>
                        <p className="text-xs text-white/50">
                            {alert.emailEnabled && alert.pushEnabled
                                ? 'Email + Push'
                                : alert.emailEnabled
                                    ? 'Email uniquement'
                                    : alert.pushEnabled
                                        ? 'Push uniquement'
                                        : 'Aucune notification'}
                        </p>
                    </div>
                </div>

                {/* Toggle Switch */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={alert.isActive}
                    aria-label={alert.isActive ? 'Désactiver l\'alerte' : 'Activer l\'alerte'}
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 ${alert.isActive ? 'bg-emerald-500' : 'bg-white/20'
                        }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${alert.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            {/* Criteria */}
            <div className="space-y-3">
                {/* Styles */}
                {alert.styles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {alert.styles.map((style) => (
                            <span
                                key={style}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30"
                            >
                                {STYLE_LABELS[style] || style}
                            </span>
                        ))}
                    </div>
                )}

                {/* Mediums */}
                {alert.mediums.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {alert.mediums.map((medium) => (
                            <span
                                key={medium}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            >
                                {MEDIUM_LABELS[medium] || medium}
                            </span>
                        ))}
                    </div>
                )}

                {/* Price Range */}
                {(alert.priceMin !== null || alert.priceMax !== null) && (
                    <p className="text-sm text-white/70">
                        Prix :{' '}
                        {alert.priceMin !== null && alert.priceMax !== null
                            ? `${formatPrice(alert.priceMin)} – ${formatPrice(alert.priceMax)}`
                            : alert.priceMin !== null
                                ? `À partir de ${formatPrice(alert.priceMin)}`
                                : `Jusqu'à ${formatPrice(alert.priceMax!)}`}
                    </p>
                )}

                {/* Artists & Categories count */}
                {(alert.artistIds.length > 0 || alert.categoryIds.length > 0) && (
                    <p className="text-xs text-white/50">
                        {alert.artistIds.length > 0 && (
                            <span>{alert.artistIds.length} artiste(s)</span>
                        )}
                        {alert.artistIds.length > 0 && alert.categoryIds.length > 0 && ' • '}
                        {alert.categoryIds.length > 0 && (
                            <span>{alert.categoryIds.length} catégorie(s)</span>
                        )}
                    </p>
                )}

                {/* Empty state */}
                {!hasCriteria && (
                    <p className="text-sm text-white/40 italic">
                        Aucun critère défini — toutes les nouvelles œuvres
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                    type="button"
                    onClick={() => onEdit(alert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Modifier l'alerte"
                >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    Modifier
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400/80 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    aria-label="Supprimer l'alerte"
                >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
            </div>
        </div>
    );
}
