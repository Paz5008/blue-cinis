"use client";
import { useState } from 'react';

export default function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }
  return (
    <button onClick={copy} className={className || 'px-3 py-1.5 rounded border bg-white hover:bg-gray-50'}>
      {copied ? 'Copié ✔' : 'Copier le lien'}
    </button>
  );
}
