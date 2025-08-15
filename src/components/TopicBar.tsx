"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/store/bookStore";
import { trpc } from "@/lib/trpc";

export function TopicBar() {
  const { topic, setTopic, setSpreads, reset, setPredictions, setGenerating, isGenerating } = useBookStore();
  const [count] = useState(12);
  const [loading, setLoading] = useState(false);
  const generateConcepts = trpc.generation.generateConcepts.useMutation();
  const startImages = trpc.generation.startImagePredictions.useMutation();

  const onGenerate = async () => {
    if (!topic || loading) return;
    setLoading(true);
    setGenerating(true);
    reset();
    try {
      const res = await generateConcepts.mutateAsync({ topic, count });
      const spreads = res.concepts.map((c, idx) => ({
        id: crypto.randomUUID(),
        title: c.title,
        paragraphs: c.paragraphs,
        status: "imagePending" as const,
      }));
      setSpreads(spreads);

      const items = spreads.map((s) => ({
        conceptId: s.id,
        prompt: `High-quality editorial illustration about "${s.title}" related to topic "${topic}". Minimalist, clean, neutral colors, no text, no watermarks.`,
      }));
      const started = await startImages.mutateAsync({ items });
      setPredictions(started.started);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto py-4">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && topic.trim()) {
              onGenerate();
            }
          }}
          placeholder="ENTER A TOPIC"
          disabled={isGenerating}
          className="w-full bg-transparent text-[48px] leading-none text-[#dadada] placeholder:text-[#dadada] outline-none border-0 focus:border-0 focus:outline-none caret-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-3 text-sm text-[#7a7a7a]">Enter a topic above to generate your book spreads.</p>
      </div>
    </div>
  );
}
