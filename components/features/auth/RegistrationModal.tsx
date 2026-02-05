"use client";
import React from 'react';
export default function RegistrationModal({ open, mode, onClose, onSwitchToLogin }: any) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg" onClick={e => e.stopPropagation()}>
                <h2>Register {mode}</h2>
                <button onClick={onSwitchToLogin}>Back to Login</button>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}
