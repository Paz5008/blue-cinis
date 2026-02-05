"use client";

import { ReactNode, useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import type { Theme } from "@/context/ThemeContext";
import SmoothScroll from "@/components/ui/SmoothScroll";

interface ClientProvidersProps {
  children: ReactNode;
  session?: Session | null;
  initialTheme?: Theme;
}

const COMMERCE_PREFIXES = ["/", "/galerie", "/selection", "/panier", "/boutique", "/success", "/cancel"];

function isCommercePath(pathname: string | null) {
  if (!pathname) return false;
  return COMMERCE_PREFIXES.some((prefix) => (prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)));
}

export function ClientProviders({ children, session, initialTheme }: ClientProvidersProps) {
  const pathname = usePathname();
  const commerceEnabled = useMemo(() => isCommercePath(pathname), [pathname]);

  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
      refetchWhenOffline={false}
    >
      <ThemeProvider initialTheme={initialTheme}>
        <ToastProvider>
          <MotionProvider mode="full">
            <SmoothScroll>
              {commerceEnabled ? <CartProvider>{children}</CartProvider> : children}
            </SmoothScroll>
          </MotionProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
