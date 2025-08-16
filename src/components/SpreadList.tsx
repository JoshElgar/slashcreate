"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
// Local minimal text splitter: wraps each character in a span to enable per-char animation
function splitIntoCharSpans(node: Element) {
  const originalHTML = (node as HTMLElement).innerHTML;
  const text = node.textContent ?? "";
  (node as HTMLElement).innerHTML = "";
  const spans: HTMLSpanElement[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.transform = "translateY(100%)";
    span.style.opacity = "0";
    // Preserve spaces visually
    if (ch === " ") {
      span.innerHTML = "&nbsp;";
    } else {
      span.textContent = ch;
    }
    (node as HTMLElement).appendChild(span);
    spans.push(span);
  }
  return {
    spans,
    revert() {
      (node as HTMLElement).innerHTML = originalHTML;
    },
  };
}
import { useBookStore } from "@/store/bookStore";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export function SpreadList() {
  const {
    spreads,
    deleteSpread,
    upsertImage,
    markFailed,
    predictions,
    updatePending,
  } = useBookStore();
  const checkImages = trpc.generation.checkImagePredictions.useMutation();

  // Poll for pending images
  useEffect(() => {
    if (Object.keys(predictions).length === 0) return;
    const interval = setInterval(async () => {
      const items = Object.entries(predictions).map(
        ([conceptId, predictionId]) => ({ conceptId, predictionId })
      );
      try {
        const res = await checkImages.mutateAsync({ items });
        res.completed.forEach((c) => upsertImage(c.conceptId, c.imageUrl));
        res.failed.forEach((f) => markFailed(f.conceptId));
        updatePending(res.pending);
      } catch (e) {
        console.error(e);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [predictions, checkImages, upsertImage, markFailed, updatePending]);

  // Now a horizontally scrollable row spanning 3 columns in a larger 5x8 grid layout.
  const { isGenerating } = useBookStore();
  const listRef = useRef<HTMLDivElement>(null);

  // Stagger in cards nicely when spreads populate
  useEffect(() => {
    if (isGenerating) return;
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(".spread-item");
    if (!items || items.length === 0) return;
    animate(items, {
      opacity: [0, 1],
      y: [12, 0],
      duration: 600,
      ease: "out(3)",
      delay: stagger(80),
    });
  }, [isGenerating, spreads.length]);

  // When generating with no spreads yet, show a row of skeleton page pairs.

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden spreads-scroll">
      <div ref={listRef} className="flex space-x-8 items-stretch">
        {isGenerating && spreads.length === 0
          ? Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex space-x-2 w-auto"
                style={{ height: "48vh" }}
              >
                <div
                  className="relative bg-panel border border-neutral-800 flex items-center justify-center"
                  style={{ aspectRatio: "9 / 16", height: "100%" }}
                >
                  <div className="size-2.5 rounded-full bg-orange-500 animate-pulse" />
                </div>
                <div
                  className="relative bg-panel border border-neutral-800 flex items-center justify-center"
                  style={{ aspectRatio: "9 / 16", height: "100%" }}
                >
                  <div className="size-2.5 rounded-full bg-orange-500 animate-pulse" />
                </div>
              </div>
            ))
          : spreads.map((spread, i) => (
              <SpreadItem
                key={spread.id}
                {...{
                  spread,
                  index: i,
                  onDelete: () => deleteSpread(spread.id),
                }}
              />
            ))}
      </div>
    </div>
  );
}

function SpreadItem({
  spread,
  index,
  onDelete,
}: {
  spread: ReturnType<typeof useBookStore.getState>["spreads"][number];
  index: number;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Per-item text split + char stagger in
    const reverts: Array<() => void> = [];
    try {
      if (titleRef.current) {
        const { spans, revert } = splitIntoCharSpans(titleRef.current);
        reverts.push(revert);
        if (spans.length) {
          animate(spans, {
            y: ["100%", "0%"],
            opacity: [0, 1],
            duration: 600,
            ease: "out(3)",
            delay: stagger(12),
          });
        }
      }
      if (contentRef.current) {
        const paragraphs = contentRef.current.querySelectorAll("p");
        paragraphs.forEach((p, pi) => {
          const { spans, revert } = splitIntoCharSpans(p);
          reverts.push(revert);
          if (spans.length) {
            animate(spans, {
              y: ["100%", "0%"],
              opacity: [0, 1],
              duration: 550,
              ease: "out(3)",
              delay: stagger(6, { start: pi * 100 }),
            });
          }
        });
      }
    } catch (e) {
      // no-op
    }
    return () => {
      reverts.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    };
  }, []);

  return (
    <div
      ref={ref}
      className="group flex gap-2 w-auto spread-item"
      style={{ height: "48vh" }}
    >
      {/* Left page - Text */}
      <Card
        className="bg-white border border-neutral-200 shadow-sm p-4 overflow-hidden flex flex-col w-auto relative"
        style={{ aspectRatio: "9 / 16", height: "100%" }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3
            ref={titleRef}
            className="text-xl font-semibold text-black leading-tight pr-2"
          >
            {spread.title}
          </h3>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center size-4 rounded border border-neutral-600 bg-black text-neutral-300 hover:cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
            aria-label="Delete spread"
          >
            <X className="size-3" />
          </button>
        </div>
        <div
          ref={contentRef}
          className="text-md leading-relaxed text-black overflow-hidden relative flex-1"
        >
          {spread.paragraphs.length > 0 ? (
            <>
              {spread.paragraphs.map((p, i) => (
                <p key={i} className="mb-2 last:mb-0">
                  {p}
                </p>
              ))}
            </>
          ) : null}
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-black opacity-60">
          {index * 2 + 1}
        </div>
      </Card>

      {/* Right page - Image */}
      <Card
        className="bg-white border border-neutral-200 shadow-sm overflow-hidden flex items-center justify-center w-auto relative"
        style={{ aspectRatio: "9 / 16", height: "100%" }}
      >
        {spread.status === "ready" && spread.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={spread.imageUrl}
            alt={spread.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200 animate-pulse flex items-center justify-center">
            <div className="text-neutral-600 text-xs">Generating image…</div>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-black opacity-60">
          {index * 2 + 2}
        </div>
      </Card>
    </div>
  );
}
