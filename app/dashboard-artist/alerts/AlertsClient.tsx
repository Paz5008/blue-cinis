'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, AlertCircle } from 'lucide-react';
import type { ArtAlert } from '@prisma/client';
import { AlertCard, AlertFormDialog } from '@/components/dashboard/alerts';

type Props = {
    initialAlerts: ArtAlert[];
    artists: { id: string; name: string }[];
    categories: { id: string; name: string }[];
};

export default function AlertsClient({ initialAlerts, artists, categories }: Props) {
    const [alerts, setAlerts] = useState<ArtAlert[]>(initialAlerts);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState<ArtAlert | null>(null);

    const handleEdit = (alert: ArtAlert) => {
        setEditingAlert(alert);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAlert(null);
        setDialogOpen(true);
    };

    const handleDeleted = (id: string) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    };

    const handleSuccess = () => {
        // Trigger a page refresh to get updated data
        window.location.reload();
    };

    return (
        <>
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-serif text-white">Mes alertes</h1>
                    <p className="text-white/60 font-light">
                        Recevez une notification quand une œuvre correspond à vos critères.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors"
                >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Créer une alerte
                </button>
            </header>

            {/* Content */}
            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-4 mb-4 rounded-full bg-white/5">
                        <Bell className="w-8 h-8 text-white/30" aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">
                        Aucune alerte configurée
                    </h2>
                    <p className="text-white/50 max-w-md mb-6">
                        Créez votre première alerte pour être notifié(e) dès qu'une nouvelle œuvre
                        correspond à vos préférences.
                    </p>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                    >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Créer une alerte
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {alerts.map((alert) => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onEdit={handleEdit}
                            onDeleted={handleDeleted}
                        />
                    ))}
                </div>
            )}

            {/* Dialog */}
            <AlertFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                alert={editingAlert}
                artists={artists}
                categories={categories}
                onSuccess={handleSuccess}
            />
        </>
    );
}
