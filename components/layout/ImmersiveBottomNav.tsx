"use client";

import React from 'react';
import { ShoppingBag, Search, User } from 'lucide-react';

export function ImmersiveBottomNav({ cartCount, onOpenSearch, onOpenCart, onOpenUser }: any) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 flex justify-around border-t border-white/10">
            <button onClick={onOpenSearch}><Search /></button>
            <button onClick={onOpenUser}><User /></button>
            <button onClick={onOpenCart} className="relative">
                <ShoppingBag />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center">{cartCount}</span>}
            </button>
        </div>
    );
}
