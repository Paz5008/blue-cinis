"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { m, AnimatePresence, type Variants } from "framer-motion";
import { useState, useRef, useEffect, useMemo, useId, useCallback, type RefObject } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
  UserCircle,
  Users,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  ClipboardList,
  LayoutDashboard,
  X,
  Sun,
  Moon,
  Menu,
  PaintBucket,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n/provider";
import { useCart } from "@/context/CartContext";
import { useStore } from "@/lib/store";

import AuthButton from "@/components/features/auth/AuthButton";
import CTA from "@/components/shared/CTA";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

// Removed unused MegaMenu/MobileMenu imports
import { type Session } from "next-auth";

// --- Theme & Colors ---
const iconColor = 'var(--nav-icon)';

const dropdownVariants: any = {
  hidden: { opacity: 0, scale: 0.97, y: -5, transition: { duration: 0.15, ease: "easeOut" } },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
  exit: { opacity: 0, scale: 0.97, y: -5, transition: { duration: 0.15, ease: "easeIn" } }
};

const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.55, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const mobileMenuVariants: Variants = {
  hidden: { x: "-100%", opacity: 0.85 },
  visible: {
    x: "0%",
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
  exit: { x: "-100%", opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
};

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

type NavbarProps = {
  categories: CategorySummary[];
  initialSession?: Session | null;
};

const LoginModalComponent = dynamic(() => import("@/components/features/auth/LoginModal"), { ssr: false });
const RegistrationModal = dynamic(() => import("@/components/features/auth/RegistrationModal"), { ssr: false });
const SearchBarShell = dynamic(() => import("@/components/layout/SearchBarShell"), { ssr: false });
const CartButton = dynamic(() => import("@/components/features/commerce/CartButton"), { ssr: false });
const MobileSearchBar = dynamic(() => import("@/components/ui/SearchBar"), { ssr: false });
const ImmersiveBottomNav = dynamic(() => import("@/components/layout/ImmersiveBottomNav").then(mod => mod.ImmersiveBottomNav), { ssr: false });

export default function Navbar({ categories, initialSession }: NavbarProps) {
  const { t } = useI18n()
  const introFinished = useStore((state) => state.introFinished);

  // --- États du Composant ---
  const [showGalleryDropdown, setShowGalleryDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showClientRegistrationModal, setShowClientRegistrationModal] = useState(false);
  const [showArtistRegistrationModal, setShowArtistRegistrationModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Close account dropdown when route changes
  const pathname = usePathname();
  useEffect(() => {
    setShowAccountDropdown(false);
    setShowGalleryDropdown(false);
    setShowMobileMenu(false);
  }, [pathname]);

  const { data: clientSession } = useSession();
  const { cart } = useCart();
  const session = clientSession ?? initialSession ?? null;
  const { theme, toggleTheme } = useTheme();

  // Refs for closing dropdowns/modal on outside click
  const accountRef = useRef<HTMLDivElement>(null);
  const galleryDropdownRef = useRef<HTMLDivElement>(null);
  const galleryButtonRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Les refs pour les modaux ne sont plus nécessaires pour le clic extérieur si l'overlay le gère
  // const loginModalRef = useRef<HTMLDivElement>(null);
  // const clientRegModalRef = useRef<HTMLDivElement>(null);
  // const artistRegModalRef = useRef<HTMLDivElement>(null);


  // --- Click Outside Handler (Simplifié) ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (accountRef.current && !accountRef.current.contains(target)) setShowAccountDropdown(false);
      if (galleryDropdownRef.current && !galleryDropdownRef.current.contains(target) &&
        galleryButtonRef.current && !galleryButtonRef.current.contains(target)) setShowGalleryDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Dependencies minimales

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showMobileMenu) {
      const target = previousFocusRef.current ?? mobileToggleRef.current;
      if (target) {
        target.focus();
      }
      previousFocusRef.current = null;
      return;
    }
    previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMobileMenu(false);
      }
    };

    const focusableSelector = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    const focusFirst = () => {
      const container = mobileMenuRef.current;
      if (!container) {
        return;
      }
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.focus();
      }
    };

    const focusTimer = window.setTimeout(focusFirst, 0);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previous;
    };
  }, [showMobileMenu]);


  const isArtist = session?.user?.role === 'artist'; // Adapt if needed

  const closeAllModals = () => {
    setShowLoginModal(false);
    setShowClientRegistrationModal(false);
    setShowArtistRegistrationModal(false);
  }

  const fallbackLabel = useCallback(
    (key: string, defaultValue: string) => {
      const value = t(key);
      return value === key ? defaultValue : value;
    },
    [t]
  );

  const navItems = useMemo(
    () => [
      { href: "/artistes", label: fallbackLabel("nav.artists", "Artistes") },
      { href: "/evenements", label: fallbackLabel("nav.events", "Évènements") },
      { href: "/contact", label: fallbackLabel("nav.visit", "Visiter la galerie") },
      { href: "/a-propos", label: fallbackLabel("nav.about", "À propos") },
    ],
    [fallbackLabel]
  );

  const isGalleryActive = pathname?.startsWith("/galerie");

  const galleryLabel = fallbackLabel("nav.gallery", "Galerie");
  const accountMenuLabel = fallbackLabel("nav.user_menu", "Menu utilisateur");
  const signInLabel = fallbackLabel("nav.sign_in", "Se connecter");
  const avatarAlt = fallbackLabel("nav.user_avatar", "Avatar utilisateur");
  const openMenuLabel = fallbackLabel("nav.open_menu", "Ouvrir le menu");
  const closeMenuLabel = fallbackLabel("nav.close_menu", "Fermer le menu");

  const openLogin = () => {
    setShowMobileMenu(false);
    closeAllModals();
    setShowLoginModal(true);
  };

  const openClientRegistration = () => {
    setShowMobileMenu(false);
    closeAllModals();
    setShowClientRegistrationModal(true);
  };

  const openArtistRegistration = () => {
    setShowMobileMenu(false);
    closeAllModals();
    setShowArtistRegistrationModal(true);
  };

  const router = useRouter();
  // Show immersive nav on public pages (mobile), exclude dashboard/admin
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
  const shouldShowImmersiveNav = !isDashboard;

  return (
    <>
      <m.header
        role="banner"
        aria-label="Navigation principale"
        className="nav-shell"
        data-elevated={isScrolled ? "true" : undefined}
        initial={{ opacity: 0, y: -20 }}
        animate={introFinished ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <div className="section-container nav-shell__inner">
          <div className="flex items-center gap-6">
            <Link href="/" className="nav-brand" aria-label="Accueil Blue Cinis">
              <m.div
                className="nav-brand__logo"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <Image
                  src="/logo_blue_cinis.png"
                  alt="Blue Cinis Logo"
                  width={220}
                  height={64}
                  priority
                  className="nav-brand__image"
                  sizes="(min-width: 1280px) 220px, (min-width: 1024px) 200px, (min-width: 768px) 170px, 150px"
                />
              </m.div>
            </Link>
          </div>

          <nav
            role="navigation"
            aria-label="Menu principal"
            className="nav-primary hidden md:flex"
          >
            <div className="relative">
              <button
                ref={galleryButtonRef}
                type="button"
                onClick={() => setShowGalleryDropdown((prev) => !prev)}
                className="nav-link"
                data-active={showGalleryDropdown || isGalleryActive ? "true" : undefined}
                aria-haspopup="true"
                aria-expanded={showGalleryDropdown}
              >
                <span>{galleryLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${showGalleryDropdown ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence>
                {showGalleryDropdown ? (
                  <GalleryDropdownMenu
                    categories={categories}
                    onClose={() => setShowGalleryDropdown(false)}
                    dropdownRef={galleryDropdownRef}
                  />
                ) : null}
              </AnimatePresence>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onNavigate={() => setShowMobileMenu(false)}
                currentPath={pathname ?? null}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <SearchBarShell />
            <ThemeToggle />
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <CartButton count={cart.length} />
            {!session ? (
              <CTA onClick={openLogin} variant="secondary" size="sm" className="md:hidden">
                {signInLabel}
              </CTA>
            ) : null}
            <div className="relative" ref={accountRef}>
              <m.button
                onClick={() => {
                  if (session) {
                    setShowAccountDropdown((prev) => !prev);
                  } else {
                    openLogin();
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="nav-control"
                aria-haspopup="true"
                aria-expanded={showAccountDropdown}
                aria-label={session ? `${accountMenuLabel} ${session.user?.name ?? ''}` : signInLabel}
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={avatarAlt}
                    width={26}
                    height={26}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <UserCircle className="h-5 w-5" aria-hidden="true" />
                )}
              </m.button>
              <AnimatePresence>
                {session && showAccountDropdown ? (
                  <AccountDropdownMenu
                    session={session}
                    isArtist={isArtist}
                    onClose={() => setShowAccountDropdown(false)}
                  />
                ) : null}
              </AnimatePresence>
            </div>
            <button
              type="button"
              className="nav-control md:hidden"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label={showMobileMenu ? closeMenuLabel : openMenuLabel}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-nav-panel"
              ref={mobileToggleRef}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </m.header>

      <AnimatePresence>
        {showMobileMenu ? (
          <MobileNavPanel
            id="mobile-nav-panel"
            categories={categories}
            navItems={navItems}
            session={session}
            isArtist={isArtist}
            onClose={() => setShowMobileMenu(false)}
            onOpenLogin={openLogin}
            onOpenClientRegistration={openClientRegistration}
            onOpenArtistRegistration={openArtistRegistration}
            onToggleTheme={toggleTheme}
            theme={theme}
            onSignOut={() => {
              setShowAccountDropdown(false);
              setShowMobileMenu(false);
              signOut();
            }}
            panelRef={mobileMenuRef}
          />
        ) : null}
      </AnimatePresence>

      <LoginModalComponent
        open={showLoginModal}
        onClose={closeAllModals}
        onSwitchToClient={() => {
          closeAllModals();
          setShowClientRegistrationModal(true);
        }}
        onSwitchToArtist={() => {
          closeAllModals();
          setShowArtistRegistrationModal(true);
        }}
      />
      <RegistrationModal
        open={showClientRegistrationModal}
        mode="client"
        onClose={closeAllModals}
        onSwitchToLogin={() => {
          closeAllModals();
          setShowLoginModal(true);
        }}
      />
      <RegistrationModal
        open={showArtistRegistrationModal}
        mode="artist"
        onClose={closeAllModals}
        onSwitchToLogin={() => {
          closeAllModals();
          setShowLoginModal(true);
        }}
      />

      {/* Immersive Navigation for Mobile on Artist Pages */}
      <div className="md:hidden">
        {shouldShowImmersiveNav && (
          <ImmersiveBottomNav
            cartCount={cart.length}
            onOpenSearch={() => setShowMobileMenu(true)}
            onOpenCart={() => router.push('/selection')}
            onOpenUser={() => {
              if (session) {
                router.push(isArtist ? '/dashboard-artist' : '/account');
              } else {
                openLogin();
              }
            }}
          />
        )}
      </div>
    </> // End Fragment
  );
}


// --- Helper Component for Main Nav Links ---
function NavLink({
  href,
  children,
  onNavigate,
  currentPath,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  currentPath: string | null;
}) {
  const isActive = currentPath === href;
  return (
    <Link
      href={href}
      className="nav-link"
      data-active={isActive ? "true" : undefined}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

// --- Helper Component for Gallery Dropdown Menu ---
interface MobileNavPanelProps {
  id: string;
  categories: CategorySummary[];
  navItems: { href: string; label: string }[];
  session: Session | null;
  isArtist: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenClientRegistration: () => void;
  onOpenArtistRegistration: () => void;
  onToggleTheme: () => void;
  theme: string;
  onSignOut: () => void;
  panelRef: RefObject<HTMLDivElement>;
}

function MobileNavPanel({
  id,
  categories,
  navItems,
  session,
  isArtist,
  onClose,
  onOpenLogin,
  onOpenClientRegistration,
  onOpenArtistRegistration,
  onToggleTheme,
  theme,
  onSignOut,
  panelRef,
}: MobileNavPanelProps) {
  const { t } = useI18n();
  const headerId = useId();

  const fallback = (key: string, fallbackValue: string) => {
    const value = t(key);
    return value === key ? fallbackValue : value;
  };

  const menuLabel = fallback('nav.menu', 'Menu');
  const closeMenu = fallback('nav.close_menu', 'Fermer le menu');
  const loginLabel = fallback('nav.sign_in', 'Se connecter');
  const registerClientLabel = fallback('nav.register_client', 'Créer un compte client');
  const registerArtistLabel = fallback('nav.register_artist', 'Devenir artiste');
  const themeLight = fallback('nav.light_mode', 'Mode clair');
  const themeDark = fallback('nav.dark_mode', 'Mode sombre');
  const viewAllArtworks = fallback('nav.all_artworks', 'Toutes les œuvres');
  const accountLabel = fallback('nav.my_account', 'Mon compte');
  const dashboardLabel = fallback('nav.dashboard', 'Tableau de bord');
  const ordersLabel = fallback('nav.my_orders', 'Mes commandes');
  const signOutLabel = fallback('nav.sign_out', 'Se déconnecter');
  const greetingLabel = fallback('nav.hello', 'Bonjour');

  const isDark = theme === 'dark';
  const limitedCategories = categories.slice(0, 6);

  return (
    <>
      <m.div
        className="nav-overlay md:hidden"
        variants={mobileOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        aria-hidden="true"
      />
      <m.aside
        id={id}
        className="mobile-nav-panel md:hidden"
        variants={mobileMenuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerId}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="mobile-nav-panel__header">
          <span id={headerId} className="text-sm font-semibold text-heading">{menuLabel}</span>
          <button type="button" className="nav-control" onClick={onClose} aria-label={closeMenu}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <MobileSearchBar />

          <div className="flex flex-col gap-1">
            <Link
              href="/galerie?page=1"
              className="nav-dropdown__item rounded-lg"
              onClick={onClose}
            >
              <PaintBucket className="h-4 w-4" aria-hidden="true" />
              <span>{fallback('nav.gallery', 'Galerie')}</span>
            </Link>
            {limitedCategories.length > 0 ? (
              <div className="flex flex-col gap-1 text-sm">
                {limitedCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/galerie/${category.slug}`}
                    className="nav-dropdown__item rounded-lg"
                    onClick={onClose}
                  >
                    <span aria-hidden="true" className="text-lg leading-none opacity-40">•</span>
                    <span>{category.name}</span>
                  </Link>
                ))}
                {categories.length > limitedCategories.length ? (
                  <Link
                    href="/galerie?page=1"
                    className="nav-dropdown__item rounded-lg"
                    onClick={onClose}
                  >
                    <span aria-hidden="true" className="text-lg leading-none opacity-40">•</span>
                    <span>{viewAllArtworks}</span>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-dropdown__item rounded-lg"
              onClick={onClose}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            type="button"
            className="nav-dropdown__item rounded-lg"
            onClick={() => {
              onToggleTheme();
            }}
            aria-pressed={isDark}
            aria-label={isDark ? themeLight : themeDark}
          >
            {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            <span>{isDark ? themeLight : themeDark}</span>
          </button>
        </div>

        <div className="nav-dropdown__separator" />

        {session ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-heading">
              {greetingLabel}{session.user?.name ? `, ${session.user.name}` : ''}
            </p>
            <Link
              href={isArtist ? "/dashboard-artist" : "/account"}
              className="nav-dropdown__item rounded-lg"
              onClick={onClose}
            >
              {isArtist ? (
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              ) : (
                <User className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isArtist ? dashboardLabel : accountLabel}</span>
            </Link>
            {!isArtist && (
              <Link href="/compte/commandes" className="nav-dropdown__item rounded-lg" onClick={onClose}>
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                <span>{ordersLabel}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                onSignOut();
              }}
              className="nav-dropdown__item rounded-lg text-red-500"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{signOutLabel}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <CTA onClick={onOpenLogin} variant="secondary" className="w-full">
              <User className="h-4 w-4 mr-2" aria-hidden="true" /> {loginLabel}
            </CTA>
            <CTA onClick={onOpenClientRegistration} variant="secondary" className="w-full">
              <Users className="h-4 w-4 mr-2" aria-hidden="true" /> {registerClientLabel}
            </CTA>
            <CTA onClick={onOpenArtistRegistration} variant="primary" className="w-full">
              <PaintBucket className="h-4 w-4 mr-2" aria-hidden="true" /> {registerArtistLabel}
            </CTA>
          </div>
        )}

        <div className="mobile-nav-panel__meta">
          <LanguageSwitcher />
        </div>
      </m.aside>
    </>
  );
}

function GalleryDropdownMenu({ categories, onClose, dropdownRef }: {
  categories: { id: string; slug: string; name: string }[];
  onClose: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}) {
  const { t } = useI18n()
  return (
    <m.div
      ref={dropdownRef}
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="nav-dropdown absolute left-0 mt-2 origin-top-left z-40"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="nav-dropdown__section" role="none">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link
              key={category.id}
              href={`/galerie/${category.slug}`}
              role="menuitem"
              className="nav-dropdown__item"
              onClick={onClose}
            >
              <span>{category.name}</span>
            </Link>
          ))
        ) : (
          <span className="nav-dropdown__item text-body-subtle" role="status">
            {t('common.loading')}
          </span>
        )}
      </div>
      <div className="nav-dropdown__separator" role="separator" />
      <div className="nav-dropdown__section">
        <Link
          href="/galerie?page=1"
          role="menuitem"
          className="nav-dropdown__item font-medium"
          onClick={onClose}
        >
          {t('nav.all_artworks')}
        </Link>
      </div>
    </m.div>
  );
}

// --- Helper Component for Account Dropdown Menu ---
function AccountDropdownMenu({ session, isArtist, onClose }: {
  session: any; // Replace 'any' with your actual session type
  isArtist: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n()
  return (
    <m.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="nav-dropdown absolute right-0 mt-2 origin-top-right z-40"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="nav-dropdown__header">
        <p className="nav-dropdown__meta">{t('nav.connected_via')}</p>
        <p className="text-sm font-medium text-heading truncate" title={session?.user?.email ?? ''}>
          {session?.user?.email}
        </p>
      </div>
      <div className="nav-dropdown__section" role="none">
        <Link
          href={isArtist ? "/dashboard-artist" : "/account"}
          role="menuitem"
          className="nav-dropdown__item"
          onClick={onClose}
        >
          {isArtist ? (
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          ) : (
            <User className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isArtist ? t('nav.dashboard') : t('nav.my_account')}</span>
        </Link>
        {!isArtist && (
          <Link
            href="/compte/commandes"
            role="menuitem"
            className="nav-dropdown__item"
            onClick={onClose}
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            <span>{t('nav.my_orders')}</span>
          </Link>
        )}
      </div>
      <div className="nav-dropdown__separator" role="separator" />
      <div className="nav-dropdown__section" role="none">
        <button
          type="button"
          onClick={() => {
            onClose();
            signOut();
          }}
          role="menuitem"
          className="nav-dropdown__item text-red-500"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>{t('nav.sign_out')}</span>
        </button>
      </div>
    </m.div>
  );
}

// Theme toggle button
// Theme toggle button
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';
  const rawLabel = isDark ? t('nav.light_mode') : t('nav.dark_mode');
  const label = rawLabel === (isDark ? 'nav.light_mode' : 'nav.dark_mode')
    ? isDark ? 'Mode clair' : 'Mode sombre'
    : rawLabel;

  if (!mounted) {
    return (
      <button
        type="button"
        className="nav-control"
        style={{ color: iconColor }}
      >
        <span className="h-5 w-5 block" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className="nav-control"
      style={{ color: iconColor }}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
