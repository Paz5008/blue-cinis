"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => (
    <div
      className="flex-1 flex items-center justify-center p-10 min-h-[60vh]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "#fff",
      }}
    >
      <div className="w-full max-w-xl animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-40 bg-gray-200 rounded mb-3" />
        <div className="h-40 bg-gray-200 rounded mb-3" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    </div>
  ),
});

export default Editor;
