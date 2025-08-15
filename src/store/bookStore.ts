import { create } from "zustand";

export type Spread = {
  id: string;
  title: string;
  paragraphs: string[]; // 4
  imageUrl?: string;
  status: "textReady" | "imagePending" | "ready" | "failed";
};

type PredictionMap = Record<string, string>; // conceptId -> predictionId

type BookState = {
  topic: string;
  spreads: Spread[];
  predictions: PredictionMap;
  isGenerating: boolean;
  hasGeneratedOnce: boolean;
  setTopic: (topic: string) => void;
  reset: () => void;
  setSpreads: (spreads: Spread[]) => void;
  upsertImage: (conceptId: string, imageUrl: string) => void;
  markFailed: (conceptId: string) => void;
  deleteSpread: (conceptId: string) => void;
  setPredictions: (
    entries: { conceptId: string; predictionId: string }[]
  ) => void;
  updatePending: (
    pending: { conceptId: string; predictionId: string }[]
  ) => void;
  setGenerating: (value: boolean) => void;
  setHasGeneratedOnce: (value: boolean) => void;
};

export const useBookStore = create<BookState>((set, get) => ({
  topic: "",
  spreads: [],
  predictions: {},
  isGenerating: false,
  hasGeneratedOnce: false,
  setTopic: (topic) => set({ topic }),
  reset: () => set({ spreads: [], predictions: {} }),
  setSpreads: (spreads) => set({ spreads }),
  upsertImage: (conceptId, imageUrl) =>
    set(({ spreads }) => ({
      spreads: spreads.map((s) =>
        s.id === conceptId ? { ...s, imageUrl, status: "ready" } : s
      ),
    })),
  markFailed: (conceptId) =>
    set(({ spreads }) => ({
      spreads: spreads.map((s) =>
        s.id === conceptId ? { ...s, status: "failed" } : s
      ),
    })),
  deleteSpread: (conceptId) =>
    set(({ spreads, predictions }) => {
      const { [conceptId]: _, ...rest } = predictions;
      return {
        spreads: spreads.filter((s) => s.id !== conceptId),
        predictions: rest,
      };
    }),
  setPredictions: (entries) =>
    set(({ predictions }) => {
      const next = { ...predictions };
      for (const e of entries) next[e.conceptId] = e.predictionId;
      return { predictions: next };
    }),
  updatePending: (pending) =>
    set(() => {
      const next: PredictionMap = {};
      for (const p of pending) next[p.conceptId] = p.predictionId;
      return { predictions: next };
    }),
  setGenerating: (value: boolean) => set({ isGenerating: value }),
  setHasGeneratedOnce: (value: boolean) => set({ hasGeneratedOnce: value }),
}));
