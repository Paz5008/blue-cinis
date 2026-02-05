"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="block w-full" onClick={() => setOpen(true)} aria-label="Agrandir l’image">
        <Image src={src} alt={alt} width={800} height={600} className={className || 'object-cover rounded'} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="max-w-5xl max-h-[90vh] p-2" role="dialog" aria-modal="true">
            <Image src={src} alt={alt} width={1600} height={1200} className="h-auto w-auto max-h-[86vh] object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
