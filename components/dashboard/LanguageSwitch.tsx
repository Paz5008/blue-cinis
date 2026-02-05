"use client";
import React from 'react';
import { useEditorI18n, Lang } from '../../context/EditorI18nContext';

export default function LanguageSwitch() {
  const { lang, setLang } = useEditorI18n();
  return (
    <div className="flex items-center justify-end p-2 border-b bg-white sticky top-0 z-10">
      <label className="text-xs text-gray-500 mr-2">Langue</label>
      <select
        className="text-xs p-1 border rounded"
        value={lang}
        onChange={(e) => setLang((e.target.value as Lang) || 'fr')}
        aria-label="Langue de l'éditeur"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
