"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const THRESHOLD = 72;
const MAX_PULL = 120;

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !enabled) return;

    const insideBlocked = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest('[data-admin-sheet], [role="dialog"]'));
    };

    const atTop = () =>
      (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || insideBlocked(e.target)) return;
      if (!atTop()) {
        pulling.current = false;
        return;
      }
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshingRef.current || !pulling.current || insideBlocked(e.target)) return;
      if (!atTop()) {
        pulling.current = false;
        setPull(0);
        return;
      }
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      const next = Math.min(MAX_PULL, dy * 0.45);
      setPull(next);
      if (next > 8) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        setPull(THRESHOLD);
        window.location.reload();
        return;
      }
      setPull(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled]);

  const progress = Math.min(1, pull / THRESHOLD);
  const showIndicator = enabled && (pull > 4 || refreshing);
  const offset = enabled ? Math.max(pull, refreshing ? 56 : 0) : 0;

  return (
    <div ref={rootRef} className="relative min-h-0 flex-1">
      {enabled && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center overflow-hidden"
          style={{ height: showIndicator ? offset : 0 }}
          aria-hidden={!showIndicator}
        >
          <div
            className="mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#e8cfa8] bg-white shadow-md"
            style={{ opacity: refreshing ? 1 : progress }}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full border-2 border-[#e8cfa8] border-t-[#8a5419] ${
                refreshing || pull >= THRESHOLD ? "animate-spin" : ""
              }`}
              style={
                refreshing || pull >= THRESHOLD
                  ? undefined
                  : { transform: `rotate(${progress * 360}deg)` }
              }
            />
          </div>
        </div>
      )}
      <div
        style={{
          transform: offset > 0 ? `translateY(${offset * 0.35}px)` : undefined,
          transition: pulling.current ? "none" : "transform 0.2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
