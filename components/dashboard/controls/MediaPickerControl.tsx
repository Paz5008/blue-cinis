"use client";
import React, { useState } from 'react';
import MediaLibrary from '@/components/shared/MediaLibrary';

interface MediaPickerControlProps {
  value?: string;
  onChange: (v?: string) => void;
  previewHeight?: number;
  label?: string;
  description?: string;
}

export default function MediaPickerControl({ value, onChange, previewHeight = 80, label = "Bibliothèque média", description }: MediaPickerControlProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {value && (
        <img src={value} alt="" className="w-full object-cover rounded mb-2" style={{ height: previewHeight }} />
      )}
      <div className="flex items-center gap-2">
        <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => setOpen(true)}>
          Choisir
        </button>
        {value && (
          <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => onChange(undefined)}>
            Retirer
          </button>
        )}
      </div>
      <MediaLibrary
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setOpen(false);
        }}
        title={label}
        description={description}
      />
    </div>
  );
}
