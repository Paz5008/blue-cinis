"use client";

import { createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { Toaster, toast } from "react-hot-toast";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number, action?: { label: string; onClick: () => void }, secondaryAction?: { label: string; onClick: () => void }) => string;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 4000, action?: { label: string; onClick: () => void }, secondaryAction?: { label: string; onClick: () => void }) => {
      let toastId: string;

      const content = (
        <div className="flex items-start gap-3">
          <div className="flex-1">{message}</div>
          <div className="flex items-center gap-2">
            {secondaryAction && (
              <button
                onClick={() => {
                  secondaryAction.onClick();
                  toast.dismiss(toastId);
                }}
                className="rounded px-2 py-1 text-xs font-semibold opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {secondaryAction.label}
              </button>
            )}
            {action ? (
              <button
                onClick={() => {
                  action.onClick();
                  toast.dismiss(toastId);
                }}
                className="rounded bg-white/20 px-2 py-1 text-xs font-bold uppercase hover:bg-white/30"
              >
                {action.label}
              </button>
            ) : (
              !secondaryAction && (
                <button
                  onClick={() => toast.dismiss(toastId)}
                  className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Fermer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              )
            )}
          </div>
        </div>
      );

      const options = { duration } as const;

      switch (type) {
        case "success":
          toastId = toast.success(content, options);
          return toastId;
        case "error":
          toastId = toast.error(content, options);
          return toastId;
        case "warning":
          toastId = toast(content, {
            ...options,
            icon: "⚠️",
            className: "!bg-amber-100 !text-amber-900 !border-amber-200",
          });
          return toastId;
        default:
          toastId = toast(content, options);
          return toastId;
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
