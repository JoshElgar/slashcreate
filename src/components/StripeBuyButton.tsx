"use client";

import { useEffect, useMemo, useRef } from "react";
import { useBookStore } from "@/store/bookStore";
import { animate } from "animejs";

export function StripeBuyButton() {
  const { hasGeneratedOnce, isGenerating, spreads } = useBookStore();
  const anyReady = useMemo(
    () => spreads.some((s) => s.status === "ready"),
    [spreads]
  );
  const anyPending = useMemo(
    () => spreads.some((s) => s.status === "imagePending"),
    [spreads]
  );
  const show = hasGeneratedOnce && anyReady && !anyPending;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 350,
        ease: "out(3)",
      });
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center py-4 transition-shadow"
    >
      <div className="group rounded-md">
        <div className="pointer-events-none absolute" aria-hidden />
        <div className="relative">
          {/* subtle hover white shadow wrapper */}
          <div className="rounded-md shadow-[0_0_0_0_rgba(255,255,255,0)] group-hover:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.15)] transition-shadow duration-300">
            {/* Stripe web component doesn't have a disabled prop; overlay to block clicks while generating */}
            <div className="relative">
              <stripe-buy-button
                buy-button-id="buy_btn_1RwJFGJ0vM7Am4Y4dU1D07ss"
                publishable-key="pk_live_51P8bcuJ0vM7Am4Y4xsMipLV7pBhNMuJhgX8A7e7551irWyn70NjRPvj1JcMakZa3odgtfowyGrzLnteA7DQnILxt00VQBUkMI5"
              ></stripe-buy-button>
              {isGenerating ? (
                <div className="absolute inset-0 rounded-md bg-black/20 cursor-not-allowed" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
