"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/context/ToastContext";

export type CartItem = {
  id: string;
  artworkId: string;
  variantId?: string | null;
  title: string;
  price: number;
  quantity: number;
  reservedAt?: number;
  expiresAt?: number;
};

type CartContextType = {
  cart: CartItem[];
  reservation: CartItem | null;
  hasReservation: boolean;
  addToCart: (item: CartItem, options?: { replace?: boolean }) => boolean;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  selectReservation: (id: string) => void;
};

const CartContext = createContext<CartContextType>({
  cart: [],
  reservation: null,
  hasReservation: false,
  addToCart: () => false,
  updateQuantity: () => { },
  removeFromCart: () => { },
  clearCart: () => { },
  selectReservation: () => { },
});

const RESERVATION_TTL_MINUTES = Number(process.env.NEXT_PUBLIC_RESERVATION_TTL_MIN ?? "15");
const RESERVATION_TTL_MS = Math.max(1, RESERVATION_TTL_MINUTES) * 60 * 1000;
const ACTIVE_SELECTION_KEY = "cart:active-selection";

function normalizeCartItem(item: CartItem): CartItem {
  const [fallbackArtworkId, fallbackVariantId] = item.id.split(":");
  const variantValue =
    typeof item.variantId === "string"
      ? item.variantId
      : item.variantId === null
        ? null
        : fallbackVariantId ?? null;
  const now = Date.now();
  const reservedAt = Number.isFinite(item.reservedAt) ? (item.reservedAt as number) : now;
  let expiresAt = Number.isFinite(item.expiresAt) ? (item.expiresAt as number) : reservedAt + RESERVATION_TTL_MS;
  if (expiresAt <= now) {
    expiresAt = now + RESERVATION_TTL_MS;
  }
  return {
    ...item,
    artworkId: item.artworkId || fallbackArtworkId || item.id,
    variantId: variantValue,
    quantity: Math.max(1, Number.isFinite(item.quantity) ? item.quantity : 1),
    reservedAt,
    expiresAt,
  };
}

function reviveStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const candidate = entry as CartItem;
      if (typeof candidate.id !== "string" || typeof candidate.title !== "string" || typeof candidate.price !== "number") {
        return null;
      }
      return normalizeCartItem(candidate);
    })
    .filter((item): item is CartItem => Boolean(item));
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize cart from localStorage, fallback to empty array
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('cart');
        return stored ? reviveStoredCart(JSON.parse(stored)) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const { addToast } = useToast();

  // [NEW] Expiration Warning
  useEffect(() => {
    if (cart.length > 0) {
      addToast("Votre panier est conservé pour 15 minutes.", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeReservationId, setActiveReservationId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(ACTIVE_SELECTION_KEY) || null;
    } catch {
      return null;
    }
  });

  function addToCart(item: CartItem, options?: { replace?: boolean }): boolean {
    let success = true;
    const now = Date.now();
    const preset = {
      ...item,
      reservedAt: now,
      expiresAt: now + RESERVATION_TTL_MS,
    };
    const normalized = normalizeCartItem(preset);
    setCart((prev) => {
      if (options?.replace) {
        success = true;
        setActiveReservationId(normalized.id);
        return [normalized];
      }
      const existingIndex = prev.findIndex((entry) => entry.id === normalized.id);
      if (existingIndex !== -1) {
        const clone = [...prev];
        clone[existingIndex] = normalized;
        success = true;
        setActiveReservationId(normalized.id);
        return clone;
      }
      success = true;
      setActiveReservationId(normalized.id);
      return [...prev, normalized];
    });
    return success;
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setActiveReservationId((current) => {
        if (!next.length) return null;
        if (!current || !next.some((item) => item.id === current)) {
          return next[next.length - 1]?.id ?? next[0].id;
        }
        if (current === id) {
          return next[next.length - 1]?.id ?? next[0].id;
        }
        return current;
      });
      return next;
    });
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const normalizedQuantity = Math.max(1, Math.min(10, Math.round(Number(quantity)) || 1));
        return { ...item, quantity: normalizedQuantity };
      })
    );
  }

  function clearCart() {
    setCart([]);
    setActiveReservationId(null);
  }

  function selectReservation(id: string) {
    setActiveReservationId((current) => {
      if (current === id) return current;
      const exists = cart.some((item) => item.id === id);
      return exists ? id : current;
    });
  }

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem('cart', JSON.stringify(cart));
    } catch {
      // ignore write errors
    }
  }, [cart]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setInterval(() => {
      setCart((prev) => {
        if (!prev.length) return prev;
        const now = Date.now();
        const next = prev.filter((item) => !item.expiresAt || item.expiresAt > now);
        if (next.length === prev.length) {
          return prev;
        }
        if (!next.some((item) => item.id === activeReservationId)) {
          setActiveReservationId(next[next.length - 1]?.id ?? null);
        }
        return next;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [activeReservationId]);
  useEffect(() => {
    try {
      if (!activeReservationId) {
        window.localStorage.removeItem(ACTIVE_SELECTION_KEY);
      } else {
        window.localStorage.setItem(ACTIVE_SELECTION_KEY, activeReservationId);
      }
    } catch {
      // ignore storage errors
    }
  }, [activeReservationId]);

  const reservation = cart.find((item) => item.id === activeReservationId) ?? cart[0] ?? null;
  const hasReservation = cart.length > 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        reservation,
        hasReservation,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        selectReservation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
