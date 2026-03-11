'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Sparkles, Wand2 } from 'lucide-react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';

import { PreviewFrame } from './PreviewFrame';
import { AiChatAssistant } from './editor/AiChatAssistant';
import { EditorProps } from './editor/types';
import { saveArtistPageLayout } from '@/src/actions/save-layout';
import { useToast } from '../../context/ToastContext';

/**
 * Adapte les blocs desktop pour un affichage mobile optimisé.
 * - columns → blocs aplatis en une seule colonne
 * - book/gallery coverflow → slider (plus léger sur mobile)
 * - spacer surdimensionné → réduit à 40px max
 */
function generateMobileLayout(desktopBlocks: any[]): any[] {
  const mobileBlocks: any[] = [];
  for (const block of desktopBlocks) {
    if (block.type === 'columns' && Array.isArray(block.columns)) {
      // Aplatir les colonnes en blocs séquentiels
      for (const col of block.columns) {
        if (Array.isArray(col.blocks)) {
          mobileBlocks.push(...col.blocks);
        }
      }
    } else if ((block.type === 'book' || block.type === 'gallery') && block.bookStyle === 'coverflow') {
      // Coverflow → slider sur mobile (moins de JS, meilleure perf)
      mobileBlocks.push({ ...block, bookStyle: 'slider' });
    } else if (block.type === 'spacer' && (block.height ?? 80) > 60) {
      // Réduire les spacers trop grands
      mobileBlocks.push({ ...block, height: 40 });
    } else {
      mobileBlocks.push(block);
    }
  }
  return mobileBlocks;
}


export default function Editor({
  initialContent,
  oeuvreOptions = [],
  artistData,
  pageKey,
}: EditorProps) {
  const { addToast } = useToast();

  const init = initialContent || {};
  const initBlocksData = init.blocksData || {};
  const initDesktopLayout = init.desktopLayout || (init.layout && init.layout.desktop) || [];
  const initialBlocksArray = initDesktopLayout.map((id: string) => initBlocksData[id]).filter(Boolean);

  const [blocks, setBlocks] = useState<any[]>(initialBlocksArray);
  const [theme, setTheme] = useState<any>(init.theme || { backgroundColor: '#ffffff', textColor: '#000000', bodyFont: 'sans-serif' });
  const [isCommitting, setIsCommitting] = useState(false);

  // État de génération IA pour l'indicateur de preview
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);
  // Compteur de mises à jour pour déclencher l'animation à chaque nouveau layout
  const [previewUpdateKey, setPreviewUpdateKey] = useState(0);

  const handlePreviewLayout = useCallback((newBlocks: any[], newTheme: any) => {
    setBlocks(newBlocks);
    // Garde : ne pas écraser le thème existant si l'IA ne renvoie rien de valide
    if (newTheme && typeof newTheme === 'object' && Object.keys(newTheme).length > 0) {
      setTheme(newTheme);
    }
    setPreviewUpdateKey((k) => k + 1);
  }, []);

  const handlePreviewUpdating = useCallback((isUpdating: boolean) => {
    setIsPreviewUpdating(isUpdating);
  }, []);

  const handleCommitLayout = async () => {
    if (blocks.length === 0) return;
    setIsCommitting(true);
    try {
      const { commitAiLayout } = await import('@/src/actions/commitAiLayout');
      await commitAiLayout(blocks, pageKey, theme);

      const blocksData = blocks.reduce((acc, b) => ({ ...acc, [b.id]: b }), {});
      const desktopLayout = blocks.map((b) => b.id);
      const mobileLayout = generateMobileLayout(blocks).map((b) => b.id);

      await saveArtistPageLayout(
        'desktop',
        {
          blocksData,
          theme,
          layout: { desktop: desktopLayout, mobile: mobileLayout },
        },
        theme,
        pageKey
      );
      addToast('Mise à jour enregistrée et appliquée en ligne !', 'success');
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('TOKENS_LIMIT_REACHED')) {
        addToast("Vous n'avez pas assez de tokens pour appliquer ce design.", 'error');
      } else {
        addToast("Erreur lors de l'application du design", 'error');
      }
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">

        {/* ══ Zone Assistant (Gauche) ══ */}
        <div className="w-[430px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-20">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <Link
              href="/dashboard-artist"
              className="inline-flex items-center text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Tableau de bord
            </Link>
            <div className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
              {pageKey || 'profile'}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden relative">
            <AiChatAssistant
              blocks={blocks}
              theme={theme}
              artistData={artistData}
              oeuvreOptions={oeuvreOptions}
              onPreviewLayout={handlePreviewLayout}
              onCommitLayout={handleCommitLayout}
              isCommitting={isCommitting}
              onPreviewUpdating={handlePreviewUpdating}
            />
          </div>
        </div>

        {/* ══ Zone Preview (Droite) ══ */}
        <div className="flex-1 overflow-y-auto bg-slate-100/60 p-8 flex flex-col items-center relative">

          {/* Badge état IA */}
          <div className="w-full max-w-[1200px] flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Aperçu en direct</span>
            </div>

            <AnimatePresence mode="wait">
              {isPreviewUpdating ? (
                <m.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                >
                  <m.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-white inline-block"
                  />
                  <span className="text-[11px] font-semibold tracking-wide">IA génère votre portfolio…</span>
                </m.div>
              ) : blocks.length > 0 ? (
                <m.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Portfolio prêt</span>
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Canvas preview avec animation au rerender */}
          <m.div
            key={previewUpdateKey}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-[1200px] w-full bg-white shadow-xl rounded-2xl ring-1 ring-black/5"
            style={{ backgroundColor: theme.backgroundColor, minHeight: 400 }}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-slate-400">
                <m.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-12 h-12 mb-4 text-slate-200" />
                </m.div>
                <p className="text-sm font-medium">Le canevas est vide.</p>
                <p className="text-xs mt-1 text-slate-300">Décrivez votre portfolio à OpenClawd pour commencer.</p>
              </div>
            ) : (
              <PreviewFrame
                blocks={blocks}
                width={1200}
                artist={artistData}
                artworks={oeuvreOptions}
                enableAbsolutePositioning={false}
              />
            )}
          </m.div>

          {/* Scroll helper */}
          <div className="h-16 flex-shrink-0" />
        </div>

      </div>
    </LazyMotion>
  );
}
