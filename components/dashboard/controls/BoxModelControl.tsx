"use client";
import React from 'react';

interface BoxModelControlProps {
    label?: string; // Optional now as we might not use it or pass it differently
    padding: { top: string; right: string; bottom: string; left: string };
    onChangePadding: (vals: { top: string; right: string; bottom: string; left: string }) => void;
}

function parseVal(v: string): number {
    return parseInt(v, 10) || 0;
}

export default function BoxModelControl({ padding, onChangePadding }: BoxModelControlProps) {
    // Simplified Box Model visualization - Padding Only

    const updatePadding = (key: keyof typeof padding, val: number) => {
        onChangePadding({ ...padding, [key]: `${val}px` });
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-neutral-900/40 rounded-xl border border-white/5 ring-1 ring-black/20">
            <div className="relative w-full h-[200px] flex flex-col items-center justify-center isolate select-none">

                {/* Padding Box - Primary Visual */}
                <div className="relative w-full h-full border border-neutral-700 bg-neutral-800/20 rounded-lg flex items-center justify-center">
                    <span className="absolute top-2 left-3 text-[9px] font-bold text-neutral-500 tracking-widest uppercase">Padding</span>

                    {/* Padding Inputs */}
                    <input
                        type="number"
                        aria-label="Padding Top"
                        className="absolute top-3 w-12 text-center bg-black/90 text-white text-[11px] font-mono border border-white/10 rounded py-1 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all z-20 hover:border-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={parseVal(padding.top)}
                        onChange={e => updatePadding('top', Number(e.target.value))}
                    />
                    <input
                        type="number"
                        aria-label="Padding Bottom"
                        className="absolute bottom-3 w-12 text-center bg-black/90 text-white text-[11px] font-mono border border-white/10 rounded py-1 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all z-20 hover:border-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={parseVal(padding.bottom)}
                        onChange={e => updatePadding('bottom', Number(e.target.value))}
                    />
                    <input
                        type="number"
                        aria-label="Padding Left"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 text-center bg-black/90 text-white text-[11px] font-mono border border-white/10 rounded py-1 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all z-20 hover:border-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={parseVal(padding.left)}
                        onChange={e => updatePadding('left', Number(e.target.value))}
                    />
                    <input
                        type="number"
                        aria-label="Padding Right"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 text-center bg-black/90 text-white text-[11px] font-mono border border-white/10 rounded py-1 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all z-20 hover:border-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={parseVal(padding.right)}
                        onChange={e => updatePadding('right', Number(e.target.value))}
                    />

                    {/* Content Box - Center */}
                    <div className="w-[50%] h-[50%] border border-dashed border-neutral-600 bg-neutral-900/40 rounded flex items-center justify-center">
                        <span className="text-[9px] text-white font-medium tracking-wider">CONTENT</span>
                    </div>
                </div>
            </div>
            <div className="text-center text-[10px] text-neutral-500 font-medium tracking-wide">
                Valeurs en pixels (px)
            </div>
        </div>
    );
}
