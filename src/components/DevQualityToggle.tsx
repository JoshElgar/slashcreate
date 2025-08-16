"use client";

import { useBookStore } from "@/store/bookStore";

export function DevQualityToggle() {
  const quality = useBookStore((s) => s.imageQuality);
  const setQuality = useBookStore((s) => s.setImageQuality);

  return (
    <div className="fixed top-2 right-2 z-50 select-none">
      <div className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900/80 backdrop-blur px-1 py-1 text-xs text-white shadow">
        <button
          onClick={() => setQuality("low")}
          className={`px-2 py-1 rounded-full transition-colors ${
            quality === "low" ? "bg-white text-black" : "hover:bg-neutral-800"
          }`}
          aria-pressed={quality === "low"}
        >
          Low
        </button>
        <button
          onClick={() => setQuality("high")}
          className={`ml-1 px-2 py-1 rounded-full transition-colors ${
            quality === "high" ? "bg-white text-black" : "hover:bg-neutral-800"
          }`}
          aria-pressed={quality === "high"}
        >
          High
        </button>
      </div>
    </div>
  );
}
