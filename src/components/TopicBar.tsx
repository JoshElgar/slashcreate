"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/store/bookStore";
import { trpc } from "@/lib/trpc";

const PLACEHOLDER_TERMS = [
  "the solar system",
  "dinosaurs",
  "the rainforest",
  "ancient Egypt",
  "ocean life",
  "robots",
  "music history",
  "butterflies",
];

export function TopicBar() {
  const {
    topic,
    setTopic,
    setSpreads,
    reset,
    setPredictions,
    setGenerating,
    isGenerating,
    setHasGeneratedOnce,
  } = useBookStore();
  const [count] = useState(12);
  const [loading, setLoading] = useState(false);
  const generateConcepts = trpc.generation.generateConcepts.useMutation();
  const generateStyle = trpc.generation.generateStyleGuide.useMutation();
  const startImages = trpc.generation.startImagePredictions.useMutation();

  const [placeholder, setPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [termIndex, setTermIndex] = useState(0);

  // Typing effect for placeholder when input is empty
  useEffect(() => {
    if (topic) return;

    const currentTerm = PLACEHOLDER_TERMS[termIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        if (placeholder.length < currentTerm.length) {
          setPlaceholder(currentTerm.substring(0, placeholder.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (placeholder.length > 0) {
          setPlaceholder(placeholder.substring(0, placeholder.length - 1));
        } else {
          setIsDeleting(false);
          setTermIndex((prev) => (prev + 1) % PLACEHOLDER_TERMS.length);
        }
      }
    };

    const typingSpeed = isDeleting ? 24 : 40;
    const timeout = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timeout);
  }, [topic, placeholder, isDeleting, termIndex]);

  const onGenerate = async () => {
    if (!topic || loading) return;
    setLoading(true);
    setGenerating(true);
    reset();
    try {
      // Notify other parts of the app that a topic has been submitted
      window.dispatchEvent(
        new CustomEvent("topic-submitted", { detail: { topic } })
      );
    } catch {}
    try {
      const res = await generateConcepts.mutateAsync({ topic, count });
      const spreads = res.concepts.map((c, idx) => ({
        id: crypto.randomUUID(),
        title: c.title,
        paragraphs: c.paragraphs,
        status: "imagePending" as const,
      }));
      setSpreads(spreads);
      setHasGeneratedOnce(true);

      let items;
      try {
        // Fetch a compact style guide once per topic
        const styleRes = await generateStyle.mutateAsync({
          topic,
          conceptTitles: spreads.map((s) => s.title),
        });
        useBookStore.getState().setStyleGuide(styleRes.style);

        const sg = styleRes.style;
        const palette = (sg.palette || [])
          .map((c) => c.hex)
          .slice(0, 4)
          .join(", ");
        const influences = (sg.influences || []).slice(0, 4).join(", ");
        const pos = (sg.keywords || []).slice(0, 12).join(", ");
        const neg = (
          sg.negativeKeywords || [
            "text",
            "caption",
            "subtitles",
            "watermark",
            "logo",
            "signature",
            "letters",
            "words",
            "typography",
            "graphic design",
            "poster",
            "diagram",
            "chart",
            "meme",
            "ui",
            "interface",
            "screenshot",
            "map",
            "sign",
            "signage",
            "flat vector",
            "clip art",
            "corporate illustration",
          ]
        )
          .slice(0, 16)
          .join(", ");

        items = spreads.map((s) => ({
          conceptId: s.id,
          prompt: `${
            s.title
          } — topic: ${topic}. A dreamy photo-illustration hybrid with cinematic depth, selective focus, volumetric light, soft bokeh, subtle film grain, painterly details. Style: ${
            sg.medium
          }${sg.camera ? ", " + sg.camera : ""}, ${sg.lighting}, ${
            sg.composition
          }${
            sg.texture ? ", " + sg.texture : ""
          }, palette ${palette}; influences ${influences}; ${pos}. No text, no captions, no subtitles, no watermarks, no logos, no signatures. Negative: ${neg}.`,
        }));
      } catch (err) {
        // Fallback to the previous simple prompt
        items = spreads.map((s) => ({
          conceptId: s.id,
          prompt: `High-quality illustration for "${s.title}" — topic: "${topic}". Dreamy photo-illustration hybrid, cinematic depth, selective focus, volumetric light, soft bokeh, subtle film grain, painterly details. No text, no captions, no subtitles, no watermarks, no logos, no signatures.`,
        }));
      }
      const quality = useBookStore.getState().imageQuality;
      const started = await startImages.mutateAsync({ items, quality });
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
        <p className="mb-3 text-sm text-soft-fg">create a book about</p>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && topic.trim()) {
              onGenerate();
            }
          }}
          placeholder={placeholder || "enter a topic"}
          disabled={isGenerating}
          spellCheck={false}
          className="w-full bg-transparent text-[48px] leading-none text-app-fg placeholder:text-app-fg outline-none border-0 focus:border-0 focus:outline-none caret-white disabled:opacity-50"
        />
      </div>
    </div>
  );
}
