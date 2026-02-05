"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ImagesLoadedInstance } from "imagesloaded";
import type imagesLoaded from "imagesloaded";
import { useI18n } from "@/i18n/provider";

type MilestoneKey = "domReady" | "fonts" | "lcp" | "images" | "load";

const MILESTONE_PROGRESS: Record<MilestoneKey, number> = {
  domReady: 62,
  fonts: 78,
  lcp: 84,
  images: 92,
  load: 100,
};

const SKIP_STORAGE_KEY = "lg_preloader_seen";
const PERSISTENT_SKIP_STORAGE_KEY = "lg_preloader_opt_out";
const PERSISTENT_SKIP_COOKIE = "lg_preloader_optout";
const PRELOADER_MODE = (process.env.NEXT_PUBLIC_PRELOADER_MODE || "").toLowerCase();
const IS_LAZY_MODE = PRELOADER_MODE === "lazy";
const IS_DISABLED = PRELOADER_MODE === "off";

const MILESTONE_STORIES: Array<{
  key: MilestoneKey;
  labelKey: string;
  fallback: string;
}> = [
    { key: "domReady", labelKey: "preloader.story.dom_ready", fallback: "Préparation de l’accrochage…" },
    { key: "fonts", labelKey: "preloader.story.fonts", fallback: "Réglage des cartels et de la typographie." },
    { key: "images", labelKey: "preloader.story.images", fallback: "Accrochage des œuvres sur les cimaises." },
    { key: "lcp", labelKey: "preloader.story.lcp", fallback: "Ajustement des lumières et des reflets." },
    { key: "load", labelKey: "preloader.story.load", fallback: "Ouverture des portes de la galerie." },
  ];

export default function Preloader() {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const shouldApplySkip = process.env.NODE_ENV === "production" && !IS_DISABLED;

  const [isVisible, setIsVisible] = useState(() => {
    if (IS_DISABLED) {
      return false;
    }
    if (typeof window === "undefined") {
      return true;
    }
    const sessionSkip = shouldApplySkip ? window.sessionStorage.getItem(SKIP_STORAGE_KEY) === "1" : false;
    let persistentSkip = false;
    try {
      persistentSkip = window.localStorage.getItem(PERSISTENT_SKIP_STORAGE_KEY) === "1";
    } catch {
      persistentSkip = false;
    }
    const cookieSkip =
      typeof document !== "undefined" && document.cookie.split(";").some((cookie) => cookie.trim() === `${PERSISTENT_SKIP_COOKIE}=1`);
    if (persistentSkip || cookieSkip) {
      return false;
    }
    if (!shouldApplySkip) {
      return true;
    }
    return !sessionSkip;
  });
  const [progress, setProgress] = useState(0);
  const [skipAvailable, setSkipAvailable] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const targetProgressRef = useRef(0);
  const rafRef = useRef<number>();
  const hideTimeoutRef = useRef<number>();
  const maxDurationTimeoutRef = useRef<number>();
  const doneRef = useRef(false);

  const milestonesRef = useRef<Record<MilestoneKey, boolean>>({
    domReady: false,
    fonts: false,
    lcp: false,
    images: false,
    load: false,
  });

  const MIN_VISIBLE_MS = shouldReduceMotion ? 650 : 1200;
  const FADE_OUT_DELAY_MS = shouldReduceMotion ? 160 : 420;
  const BASELINE_DURATION_MS = shouldReduceMotion ? 900 : 1600;
  const BASELINE_TARGET = shouldReduceMotion ? 48 : 58;
  const MAX_LOADER_DURATION_MS = shouldReduceMotion ? 4000 : 7000;

  const updateTargetProgress = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, 0), 100);
    if (clamped <= targetProgressRef.current) {
      return;
    }
    targetProgressRef.current = clamped;
  }, []);

  const attemptFinish = useCallback(
    (force?: boolean) => {
      if (doneRef.current) {
        return;
      }

      const milestones = milestonesRef.current;
      const hasImages = shouldReduceMotion || milestones.images;
      const hasLcp = shouldReduceMotion || milestones.lcp;
      const lazyReady = IS_LAZY_MODE && milestones.domReady;
      const criticalReady =
        force ||
        milestones.load ||
        lazyReady ||
        (milestones.domReady && milestones.fonts && hasImages && hasLcp);

      if (!criticalReady) {
        return;
      }

      doneRef.current = true;
      updateTargetProgress(100);

      const now = performance.now();
      const elapsed = startTimeRef.current ? now - startTimeRef.current : 0;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, remaining + FADE_OUT_DELAY_MS);

      try {
        if (shouldApplySkip) {
          window.sessionStorage.setItem(SKIP_STORAGE_KEY, "1");
        }
        if (force) {
          try {
            window.localStorage.setItem(PERSISTENT_SKIP_STORAGE_KEY, "1");
          } catch {
            // ignore unavailable storage
          }
          if (typeof document !== "undefined") {
            document.cookie = `${PERSISTENT_SKIP_COOKIE}=1; max-age=31536000; path=/`;
          }
        }
      } catch {
        // ignore unavailable storage
      }
    }, [
    FADE_OUT_DELAY_MS,
    MIN_VISIBLE_MS,
    shouldApplySkip,
    shouldReduceMotion,
    updateTargetProgress,
  ]);

  const markMilestone = useCallback(
    (key: MilestoneKey) => {
      if (milestonesRef.current[key]) {
        return;
      }
      milestonesRef.current[key] = true;
      updateTargetProgress(MILESTONE_PROGRESS[key]);
      if (key === "domReady") {
        setSkipAvailable(true);
      }
      attemptFinish();
    },
    [attemptFinish, updateTargetProgress]
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const step = () => {
      setProgress((prev) => {
        const target = targetProgressRef.current;
        const diff = target - prev;
        if (Math.abs(diff) < 0.1) {
          return target;
        }

        const easingStrength = shouldReduceMotion ? 0.18 : 0.24;
        const eased = prev + diff * easingStrength + Math.sign(diff) * (shouldReduceMotion ? 0.18 : 0.32);
        return Math.min(Math.max(eased, 0), 100);
      });
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible, shouldReduceMotion]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let rafId: number;

    const updateBaseline = () => {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now();
      }

      const elapsed = performance.now() - startTimeRef.current;
      const baseline = Math.min(BASELINE_TARGET, (elapsed / BASELINE_DURATION_MS) * BASELINE_TARGET);
      updateTargetProgress(baseline);

      rafId = requestAnimationFrame(updateBaseline);
    };

    rafId = requestAnimationFrame(updateBaseline);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [BASELINE_DURATION_MS, BASELINE_TARGET, isVisible, updateTargetProgress]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (shouldReduceMotion) {
      markMilestone("images");
      return;
    }

    let instance: ImagesLoadedInstance | null = null;
    let cancelled = false;
    let totalImages = 0;

    const handleProgress = (inst: ImagesLoadedInstance) => {
      if (cancelled) {
        return;
      }
      if (totalImages === 0) {
        return;
      }
      const ratio = inst.progressedCount / totalImages;
      const weighted = 56 + ratio * 30;
      updateTargetProgress(weighted);
    };

    const handleAlways = () => {
      if (cancelled) {
        return;
      }
      markMilestone("images");
    };

    const bootstrap = async () => {
      const mainElement = document.getElementById("main");
      if (!mainElement) {
        return;
      }

      try {
        const mod = (await import("imagesloaded")) as { default: typeof imagesLoaded | undefined };
        if (cancelled) {
          return;
        }

        const imagesLoadedFn = typeof mod.default === "function" ? mod.default : null;
        if (!imagesLoadedFn) {
          markMilestone("images");
          return;
        }

        instance = imagesLoadedFn(mainElement, { background: true });
        totalImages = instance.images.length;

        if (totalImages === 0) {
          updateTargetProgress(66);
          markMilestone("images");
          return;
        }

        instance.on("progress", handleProgress);
        instance.on("always", handleAlways);
      } catch {
        if (!cancelled) {
          markMilestone("images");
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      if (instance) {
        instance.off("progress", handleProgress);
        instance.off("always", handleAlways);
        instance = null;
      }
    };
  }, [isVisible, markMilestone, shouldReduceMotion, updateTargetProgress]);

  useEffect(() => {
    if (shouldReduceMotion) {
      markMilestone("lcp");
    }
  }, [markMilestone, shouldReduceMotion]);

  useEffect(() => {
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      fonts.ready.then(() => {
        if (!cancelled) {
          markMilestone("fonts");
        }
      });
    } else {
      markMilestone("fonts");
    }

    return () => {
      cancelled = true;
    };
  }, [markMilestone]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const onDomContentLoaded = () => {
      markMilestone("domReady");
    };

    if (document.readyState === "interactive" || document.readyState === "complete") {
      onDomContentLoaded();
    } else {
      document.addEventListener("DOMContentLoaded", onDomContentLoaded, { once: true });
    }

    return () => {
      document.removeEventListener("DOMContentLoaded", onDomContentLoaded);
    };
  }, [isVisible, markMilestone]);

  useEffect(() => {
    if (!isVisible || shouldReduceMotion) {
      return;
    }

    if (typeof PerformanceObserver === "undefined") {
      markMilestone("lcp");
      return;
    }

    let cancelled = false;
    const observer = new PerformanceObserver((entryList) => {
      if (cancelled) {
        return;
      }

      const entries = entryList.getEntries();
      if (entries.length > 0) {
        markMilestone("lcp");
        observer.disconnect();
        cancelled = true;
      }
    });

    try {
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      const performanceEntries = typeof performance.getEntriesByType === "function" ? performance.getEntriesByType("largest-contentful-paint") : [];
      if (performanceEntries.length > 0) {
        markMilestone("lcp");
        observer.disconnect();
        cancelled = true;
      }
    } catch {
      markMilestone("lcp");
    }

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [isVisible, markMilestone, shouldReduceMotion]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const finishLoading = () => {
      markMilestone("load");
    };

    if (document.readyState === "complete") {
      finishLoading();
    } else {
      window.addEventListener("load", finishLoading, { once: true });
    }

    return () => {
      window.removeEventListener("load", finishLoading);
    };
  }, [isVisible, markMilestone]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = undefined;
      }
      if (maxDurationTimeoutRef.current) {
        window.clearTimeout(maxDurationTimeoutRef.current);
        maxDurationTimeoutRef.current = undefined;
      }
    };
  }, []);

  const coverScale = useMemo(() => {
    const value = 1 - progress / 100;
    if (value <= 0) {
      return 0;
    }
    return parseFloat(value.toFixed(3));
  }, [progress]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    maxDurationTimeoutRef.current = window.setTimeout(() => {
      updateTargetProgress(100);
      attemptFinish();
    }, MAX_LOADER_DURATION_MS);

    return () => {
      if (maxDurationTimeoutRef.current) {
        window.clearTimeout(maxDurationTimeoutRef.current);
        maxDurationTimeoutRef.current = undefined;
      }
    };
  }, [MAX_LOADER_DURATION_MS, attemptFinish, isVisible, updateTargetProgress]);
  const handleSkip = useCallback(() => {
    updateTargetProgress(100);
    attemptFinish(true);
  }, [attemptFinish, updateTargetProgress]);

  const preloaderMessage = useMemo(() => {
    const achieved = MILESTONE_STORIES.filter((story) => milestonesRef.current[story.key]);
    const fallbackIndex = Math.min(MILESTONE_STORIES.length - 1, Math.floor(progress / 25));
    const storyToUse = achieved.length > 0 ? achieved[achieved.length - 1] : MILESTONE_STORIES[fallbackIndex];

    if (!t) {
      return storyToUse.fallback;
    }
    const translated = t(storyToUse.labelKey);
    return translated && translated !== storyToUse.labelKey ? translated : storyToUse.fallback;
  }, [progress, t]);

  const staticLogo = (
    <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.95),rgba(255,255,255,0.4))] shadow-glass-md">
      <div className="relative h-32 w-32">
        <Image
          src="/logo_blue_cinis.png"
          alt="Blue Cinis"
          fill
          priority
          sizes="128px"
          className="object-contain"
        />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          key="lg-preloader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#ede4d1] via-[#f5efe4] to-[#d6c3a8] text-text-heading"
          aria-live="polite"
          aria-busy="true"
        >
          {shouldReduceMotion ? null : (
            <>
              <m.span
                aria-hidden="true"
                initial={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: [0.45, 0.65, 0.45], scale: [0.9, 1.02, 0.9] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -inset-32 rounded-full bg-[radial-gradient(circle_at_top,var(--accent-soft),transparent_60%)] blur-3xl"
              />

              <m.span
                aria-hidden="true"
                initial={{ opacity: 0.2, scale: 0.6 }}
                animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.15, 0.8], rotate: [0, 12, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.55),rgba(255,255,255,0))] blur-2xl"
              />
            </>
          )}

          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative flex w-full max-w-[460px] flex-col items-center rounded-[34px] border border-white/30 bg-white/50 p-14 shadow-glass-lg backdrop-blur-2xl"
          >
            <div className="relative w-full overflow-hidden rounded-[28px] border border-white/30 bg-[rgba(243,236,225,0.55)] px-12 py-14 shadow-inner">
              <m.div
                aria-hidden="true"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: coverScale }}
                transition={{ duration: shouldReduceMotion ? 0.25 : 0.45, ease: "easeOut" }}
                style={{ transformOrigin: "right center" }}
                className="absolute inset-y-[-32px] inset-x-[-32px] rounded-[32px] bg-[linear-gradient(135deg,rgba(94,72,54,0.18),rgba(255,255,255,0.85))]"
              />

              <div className="relative flex flex-col items-center gap-10">
                {shouldReduceMotion ? (
                  staticLogo
                ) : (
                  <m.div
                    initial={{ scale: 0.92, rotate: -6 }}
                    animate={{ scale: [0.96, 1.04, 0.96], rotate: [4, -4, 4] }}
                    transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0.4))] shadow-glass-md"
                  >
                    <div className="relative h-40 w-40">
                      <Image
                        src="/logo_blue_cinis.png"
                        alt="Blue Cinis"
                        fill
                        priority
                        sizes="160px"
                        className="object-contain"
                      />
                    </div>
                  </m.div>
                )}

                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm font-medium uppercase tracking-[0.28em] text-[color:var(--color-text-body-subtle)]">
                    {preloaderMessage}
                  </p>
                  <span className="text-xs text-[color:var(--color-text-body-subtle)]">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/35">
                  <m.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progress / 100 }}
                    transition={{ duration: shouldReduceMotion ? 0.2 : 0.35, ease: "easeOut" }}
                    style={{ transformOrigin: "left center" }}
                    className="absolute inset-0 rounded-full bg-accent"
                  />
                </div>
              </div>
            </div>
            {skipAvailable ? (
              <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm text-[color:var(--color-text-body-subtle)]">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-full border border-white/40 bg-white/70 px-6 py-2 text-sm font-semibold text-[color:var(--color-text-heading)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {t ? t("preloader.skip.cta") : "Entrer dans la galerie"}
                </button>
                <p className="text-xs leading-relaxed">
                  {t
                    ? t("preloader.skip.hint")
                    : "Accéder au site dès que le contenu est prêt. Ce choix sera mémorisé pour vos prochaines visites."}
                </p>
              </div>
            ) : null}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
