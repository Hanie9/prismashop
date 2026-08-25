"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const STORAGE_PREFIX = "prismashop-scroll:";

function routeKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function getScrollY() {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function scrollWindowTo(y: number, behavior: ScrollBehavior = "auto") {
  window.scrollTo({ top: y, left: 0, behavior });
  if (behavior === "auto") {
    document.documentElement.scrollTop = y;
    document.body.scrollTop = y;
  }
}

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function smoothScrollTo(
  targetY: number,
  onDone?: () => void,
): { cancel: () => void } {
  const startY = getScrollY();
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) {
    scrollWindowTo(targetY, "auto");
    onDone?.();
    return { cancel: () => {} };
  }

  const duration = Math.min(2200, Math.max(900, Math.abs(distance) * 0.85));
  const startTime = performance.now();
  let frameId = 0;

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutQuart(progress);
    scrollWindowTo(startY + distance * eased, "auto");

    if (progress < 1) {
      frameId = window.requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  };

  frameId = window.requestAnimationFrame(step);

  return {
    cancel: () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    },
  };
}

function readSavedScroll(key: string): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return 0;
    const y = Number(raw);
    return Number.isFinite(y) && y > 0 ? Math.round(y) : 0;
  } catch {
    return 0;
  }
}

function writeSavedScroll(key: string, y: number) {
  try {
    if (!key) return;
    if (y <= 8) sessionStorage.removeItem(STORAGE_PREFIX + key);
    else sessionStorage.setItem(STORAGE_PREFIX + key, String(Math.round(y)));
  } catch {
    /* ignore */
  }
}

function isInternalNavAnchor(el: Element | null): HTMLAnchorElement | null {
  const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a) return null;
  if (a.target && a.target !== "_self") return null;
  if (a.hasAttribute("download")) return null;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }
  try {
    const url = new URL(a.href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return a;
  } catch {
    return null;
  }
}

function ScrollRestorationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const key = routeKey(pathname, search);

  const currentKeyRef = useRef(key);
  const scrollYRef = useRef(0);
  const restoringRef = useRef(false);
  const restoreTimerRef = useRef<number | null>(null);
  const persistTimerRef = useRef<number | null>(null);
  const scrollAnimRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const persistNow = () => {
      if (restoringRef.current) return;
      const y = getScrollY();
      scrollYRef.current = y;
      writeSavedScroll(currentKeyRef.current, y);
    };

    const onScroll = () => {
      scrollYRef.current = getScrollY();
      if (restoringRef.current) return;
      if (persistTimerRef.current != null) window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = window.setTimeout(persistNow, 80);
    };

    const onNavigateIntent = (event: Event) => {
      const target = event.target as Element | null;
      if (!isInternalNavAnchor(target)) return;
      if (restoringRef.current) return;
      scrollYRef.current = getScrollY();
      writeSavedScroll(currentKeyRef.current, scrollYRef.current);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      onNavigateIntent(event);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onNavigateIntent, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", persistNow);
    window.addEventListener("beforeunload", persistNow);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persistNow();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onNavigateIntent, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", persistNow);
      window.removeEventListener("beforeunload", persistNow);
      if (persistTimerRef.current != null) window.clearTimeout(persistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    currentKeyRef.current = key;

    const clearTimer = () => {
      if (restoreTimerRef.current != null) {
        window.clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }
    };

    clearTimer();

    if (window.location.hash) {
      restoringRef.current = false;
      return;
    }

    const savedY = readSavedScroll(key);
    restoringRef.current = true;
    scrollWindowTo(0, "auto");
    scrollYRef.current = 0;

    if (savedY <= 8) {
      restoringRef.current = false;
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let animated = false;
    let resizeObserver: ResizeObserver | null = null;

    const unlock = () => {
      restoringRef.current = false;
      clearTimer();
      scrollAnimRef.current?.cancel();
      scrollAnimRef.current = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
    };

    const animateTo = (target: number) => {
      if (animated || cancelled) return;
      animated = true;
      scrollWindowTo(0, "auto");
      restoreTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        scrollAnimRef.current?.cancel();
        scrollAnimRef.current = smoothScrollTo(target, () => {
          if (cancelled) return;
          scrollYRef.current = getScrollY();
          writeSavedScroll(key, scrollYRef.current);
          unlock();
        });
      }, 120);
    };

    const tryRestore = () => {
      if (cancelled || animated) return;
      attempts += 1;

      const pageHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      const maxScroll = Math.max(0, pageHeight - window.innerHeight);
      const target = Math.min(savedY, maxScroll);
      const tallEnough = maxScroll >= savedY * 0.85 || maxScroll >= savedY - 40;

      if (!tallEnough && attempts < 30) {
        restoreTimerRef.current = window.setTimeout(tryRestore, 80);
        return;
      }

      if (target <= 8) {
        unlock();
        return;
      }

      animateTo(target);
    };

    restoreTimerRef.current = window.setTimeout(tryRestore, 60);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (cancelled || animated || !restoringRef.current) return;
        tryRestore();
      });
      resizeObserver.observe(document.documentElement);
      if (document.body) resizeObserver.observe(document.body);
    }

    return () => {
      cancelled = true;
      unlock();
    };
  }, [key]);

  return null;
}

export default function ScrollToTop() {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationInner />
    </Suspense>
  );
}
