"use client";
import React from 'react';
export default function LoginModal({ open, onClose, onSwitchToClient, onSwitchToArtist }: any) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg" onClick={e => e.stopPropagation()}>
                <h2>Login</h2>
                <button onClick={onSwitchToClient}>Register Client</button>
                <button onClick={onSwitchToArtist}>Register Artist</button>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}
