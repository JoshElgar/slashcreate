"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
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

  // When generating with no spreads yet, show a row of skeleton page pairs.

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-hidden spreads-scroll">
      <div className="flex gap-8 px-1">
        {isGenerating && spreads.length === 0
          ? Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex gap-2 w-auto"
                style={{ height: "48vh" }}
              >
                <div
                  className="bg-[#2a2a2a] border border-neutral-800 grid place-items-center"
                  style={{ aspectRatio: "9 / 16", height: "100%" }}
                >
                  <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
                </div>
                <div
                  className="bg-[#2a2a2a] border border-neutral-800 grid place-items-center"
                  style={{ aspectRatio: "9 / 16", height: "100%" }}
                >
                  <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
                </div>
              </div>
            ))
          : spreads.map((spread) => (
              <SpreadItem
                key={spread.id}
                {...{ spread, onDelete: () => deleteSpread(spread.id) }}
              />
            ))}
      </div>
    </div>
  );
}

function SpreadItem({
  spread,
  onDelete,
}: {
  spread: ReturnType<typeof useBookStore.getState>["spreads"][number];
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 400,
      ease: "out(3)",
    });
    return () => {
      if (!ref.current) return;
      animate(ref.current, {
        opacity: 0,
        scale: 0.98,
        duration: 220,
        ease: "in(3)",
      });
    };
  }, []);

  return (
    <div
      ref={ref}
      className="group flex flex-col items-center w-auto"
      style={{ height: "48vh" }}
    >
      <div className="flex gap-2 w-auto">
        {/* Left page - Text */}
        <Card
          className="bg-[#2a2a2a] border border-neutral-800 shadow-sm p-4 overflow-hidden flex flex-col w-auto"
          style={{ aspectRatio: "9 / 16", height: "100%" }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-[#dadada] leading-tight pr-2">
              {spread.title}
            </h3>
            {/* Delete button moved below, only on hover */}
          </div>
          <div className="text-xs leading-relaxed text-[#dadada] overflow-hidden relative flex-1">
            {spread.paragraphs.length > 0 ? (
              <>
                {spread.paragraphs.map((p, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {p}
                  </p>
                ))}
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-3 rounded bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded w-5/6 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded w-4/5 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded w-3/4 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded mt-3 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded w-5/6 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded w-4/5 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
                <div className="h-3 rounded w-2/3 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-no-repeat bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]" />
              </div>
            )}
          </div>
        </Card>

        {/* Right page - Image */}
        <Card
          className="bg-[#2a2a2a] border border-neutral-800 shadow-sm overflow-hidden flex items-center justify-center w-auto"
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
              <div className="text-neutral-400 text-xs">Generating image…</div>
            </div>
          )}
        </Card>
        {/* Hover-only delete below the spread */}
        <div className="w-full flex justify-center">
          <button
            onClick={onDelete}
            className="mt-2 hidden group-hover:flex items-center justify-center px-2 py-1 text-xs rounded border border-neutral-700 text-[#dadada] hover:bg-neutral-800"
            aria-label="Delete spread"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
