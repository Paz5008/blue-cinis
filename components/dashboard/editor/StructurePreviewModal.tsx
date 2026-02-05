import React from 'react';

interface StructurePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    section: any;
    artistData: any;
}

export function StructurePreviewModal({ isOpen, onClose, section }: StructurePreviewModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg">
                <h3>Aperçu: {section?.label}</h3>
                <button onClick={onClose}>Fermer</button>
            </div>
        </div>
    );
}
