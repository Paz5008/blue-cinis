"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SHARED_ASSETS } from "@/lib/cms/shared-assets";

type MediaTab = "upload" | "library" | "shared";

interface MediaItem {
  name: string;
  url: string;
  uploadedAt?: string;
  size?: number;
}

interface MediaLibraryProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  description?: string;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
  fileName?: string;
}

const EMPTY_UPLOAD_STATE: UploadState = { status: "idle" };

export default function MediaLibrary({
  visible,
  onClose,
  onSelect,
  title = "Bibliothèque média",
  description = "Téléversez de nouvelles images ou sélectionnez un média déjà importé.",
}: MediaLibraryProps) {
  const [tab, setTab] = useState<MediaTab>("library");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<MediaItem | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(EMPTY_UPLOAD_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setPortalNode(document.body);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setTab("library");
    setSearch("");
    resetUploadState();
    setIsDragging(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/uploads");
      if (!res.ok) {
        throw new Error("Impossible de récupérer la bibliothèque");
      }
      const data = await res.json();
      const items: MediaItem[] = Array.isArray(data?.media) ? data.media : [];
      setMedia(items);
      setActive(items[0] ?? null);
    } catch (err: any) {
      setError(err?.message || "Erreur inconnue");
      setMedia([]);
      setActive(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (tab === "library") {
      fetchLibrary();
    }
  }, [visible, tab, fetchLibrary]);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  }, [visible, tab]);

  useEffect(() => {
    const items = media.filter((item) =>
      item.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    if (items.length === 0) {
      setActive(null);
      return;
    }
    if (active && items.some((item) => item.url === active.url)) {
      return;
    }
    setActive(items[0]);
  }, [search, media, active]);

  const filteredMedia = useMemo(() => {
    if (!search.trim()) return media;
    const needle = search.trim().toLowerCase();
    return media.filter((item) => item.name.toLowerCase().includes(needle));
  }, [media, search]);

  const resetUploadState = () => setUploadState(EMPTY_UPLOAD_STATE);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    resetUploadState();
    setUploadState({ status: "uploading", fileName: file.name });
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Échec du téléversement");
      }
      const payload = await res.json();
      const url = String(payload?.url || "");
      if (!url) {
        throw new Error("Réponse invalide du serveur");
      }
      setUploadState({ status: "success", fileName: file.name, message: "Image importée" });
      await fetchLibrary();
      setTab("library");
      onSelect(url);
      onClose();
    } catch (err: any) {
      setUploadState({ status: "error", fileName: file?.name, message: err?.message || "Échec du téléversement" });
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const renderUploadTab = () => {
    const isUploading = uploadState.status === "uploading";
    const isError = uploadState.status === "error";
    const isSuccess = uploadState.status === "success";

    return (
      <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <div
            className={`relative border-2 border-dashed rounded-xl transition-colors ${isDragging ? "border-blue-500 bg-blue-50/60" : "border-gray-300 bg-gray-50"
              } ${isUploading ? "opacity-70" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm text-2xl text-blue-500">
                ⬆
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900">Déposez vos fichiers ici</p>
                <p className="text-sm text-gray-600">
                  Formats acceptés: PNG, JPG, JPEG, WEBP, GIF. Taille maximale 10&nbsp;Mo.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Sélectionner une image
                </button>
                <span className="text-xs text-gray-500">ou glissez-déposez un fichier</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0] || null)}
                disabled={isUploading}
              />
            </div>
          </div>
          {uploadState.status !== "idle" && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${isError
                ? "border-red-200 bg-red-50 text-red-700"
                : isSuccess
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
            >
              {isUploading && (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" aria-hidden />
                  <span>Téléversement en cours…</span>
                  {uploadState.fileName && <span className="font-medium">{uploadState.fileName}</span>}
                </div>
              )}
              {(isError || isSuccess) && (
                <div className="flex flex-col">
                  <span className="font-medium">{uploadState.message}</span>
                  {uploadState.fileName && (
                    <span className="text-xs opacity-80">{uploadState.fileName}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLibraryTab = () => {
    const emptyState = !loading && filteredMedia.length === 0;

    return (
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 sm:px-8">
        <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-white/95 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-4">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom de fichier"
              className="flex-1 border-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={fetchLibrary}
            className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            ↻ Actualiser
          </button>
        </div>
        <div className="grid min-h-[320px] gap-5 md:min-h-0 md:grid-cols-[minmax(0,3fr)_minmax(260px,1.2fr)] md:items-start">
          <div className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" aria-hidden />
                  Chargement…
                </div>
              </div>
            )}
            {emptyState ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-sm text-gray-500">
                <span>Vous n’avez pas encore importé de média.</span>
                <button
                  type="button"
                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setTab("upload")}
                >
                  Importer une image
                </button>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredMedia.map((item) => {
                    const isActive = active?.url === item.url;
                    return (
                      <button
                        key={item.url}
                        type="button"
                        className={`group relative aspect-square overflow-hidden rounded-lg border text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isActive ? "border-blue-500" : "border-gray-200"
                          }`}
                        onClick={() => setActive(item)}
                        onDoubleClick={() => {
                          onSelect(item.url);
                          onClose();
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[11px] font-medium text-white">
                          {item.name}
                        </span>
                        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/40 text-sm font-medium text-white group-hover:flex">
                          Utiliser
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <aside className="flex min-h-[280px] flex-col gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 md:min-h-0">
            {active ? (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
                  <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <img
                      src={active.url}
                      alt={active.name}
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="font-semibold text-gray-900">{active.name}</div>
                    {active.uploadedAt && (
                      <div className="text-xs text-gray-500">Importé le {new Date(active.uploadedAt).toLocaleString()}</div>
                    )}
                    {active.size != null && (
                      <div className="text-xs text-gray-500">{formatSize(active.size)}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    onClick={() => {
                      onSelect(active.url);
                      onClose();
                    }}
                  >
                    Utiliser ce média
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      navigator.clipboard?.writeText(active.url).catch(() => { });
                    }}
                  >
                    Copier l’URL
                  </button>
                  <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                    Astuce: double-cliquez sur une vignette pour l’utiliser immédiatement dans votre page.
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
                Sélectionnez un média pour afficher ses détails.
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  };

  const renderSharedTab = () => {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pt-4">
          {SHARED_ASSETS.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => {
                onSelect(asset.url);
                onClose();
              }}
            >
              <img
                src={asset.url}
                alt={asset.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[11px] font-medium text-white">
                {asset.name}
              </span>
              <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                {asset.category}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
          <p><strong>Note :</strong> Ces images sont fournies par la Galerie Loire pour embellir vos mises en page. Elles sont libres de droits pour votre usage sur la plateforme.</p>
        </div>
      </div>
    );
  };

  if (!visible || !portalNode) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/55 px-0 py-6 sm:px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={containerRef}
        tabIndex={-1}
        className="flex h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl focus:outline-none sm:my-6 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
      >
        <header className="flex flex-col gap-2 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <nav className="flex overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-sm font-medium">
              <button
                type="button"
                className={`px-4 py-2 transition ${tab === "library" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}
                onClick={() => setTab("library")}
              >
                Bibliothèque
              </button>
              <button
                type="button"
                className={`px-4 py-2 transition ${tab === "upload" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}
                onClick={() => {
                  resetUploadState();
                  setTab("upload");
                }}
              >
                Importer
              </button>
              <button
                type="button"
                className={`px-4 py-2 transition ${tab === "shared" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}
                onClick={() => setTab("shared")}
              >
                Galerie Loire
              </button>
            </nav>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </header>
        {error && (
          <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
          {tab === "upload" ? renderUploadTab() : tab === "shared" ? renderSharedTab() : renderLibraryTab()}
        </div>
      </div>
    </div>,
    portalNode
  );
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["o", "Ko", "Mo", "Go"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[unitIndex]}`;
}
