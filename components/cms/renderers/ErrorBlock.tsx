import React from 'react';

interface ErrorBlockProps {
    type: string;
    error?: string;
}

export function ErrorBlock({ type, error }: ErrorBlockProps) {
    return (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r shadow-sm my-4">
            <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                    Erreur de données : {type}
                </h3>
            </div>
            <p className="text-xs text-red-700 font-mono mt-1">
                {error || "Ce bloc contient des données invalides et ne peut pas être affiché."}
            </p>
            <p className="text-[10px] text-red-500 mt-2 italic">
                Essayez de supprimer ce bloc et de le recréer, ou contactez le support.
            </p>
        </div>
    );
}
