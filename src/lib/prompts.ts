import { StyleGuide } from "@/types/style";

// Centralized prompts and builders

export const CONCEPTS_SYSTEM_PROMPT =
  'You are generating book content. The tone should be accessible and informalm but informed. It is not an informational brochure - it\'s an interesting book written by a friend who knows a lot about the topic and is explaining the most interesting things to you in a professional way. Return strict JSON only. No prose. JSON shape: {\n  "concepts": [ { "title": string, "paragraphs": string[1] } ]\n}';

export function buildConceptsUserPrompt(topic: string, count: number): string {
  return `Topic: ${topic}. Generate ${count} interesting concepts/thoughts about the topic, simple language. Rare stories, interesting facts, etc. Don't make anything up. For each, return: title (<=3 words), paragraphs (array with 1 paragraph, 100 words max). Return only JSON: { concepts: { title: string, paragraphs: string[1] }[] }.`;
}

export const STYLE_GUIDE_SYSTEM_PROMPT =
  'You are an expert art director. Return strict JSON only. No prose. JSON shape: {"palette": {"hex": string}[], "lighting": string, "medium": string, "composition": string, "camera"?: string|null, "texture"?: string, "influences": string[], "keywords": string[], "negativeKeywords": string[], "aspect"?: string}';

export function buildStyleGuideUserPrompt(
  topic: string,
  conceptTitles?: string[]
): string {
  const titles = conceptTitles?.slice(0, 12).join("; ");
  return `Topic: ${topic}. Create a very specific, unmistakably topic-driven visual style guide that a diffusion model can follow across many images.
Target vibe: dreamy, midjourney-esque photo-illustration hybrid; cinematic depth; selective focus; volumetric light; soft bokeh; subtle film grain; painterly details; crisp focal points with softer supporting areas where appropriate.
Include signature visual cues from the topic (era, place, franchise, movement, materials, production design, motifs, weather, mood). If the topic implies a strong aesthetic (e.g., cyberpunk neon rain, noir lighting, retro-futurism), encode that explicitly.
Provide:
- palette (3-8 cohesive hex colors that match the topic)
- lighting (concise, cinematic/photographic lighting description)
- medium (e.g., dreamy photo-illustration hybrid, cinematic key art, stylized concept art, analog film photo, matte painting)
- composition (framing rules and shot style)
- camera (optional lenses/sensors/film if relevant)
- texture (optional surface/material/film grain)
- influences (2-6 highly relevant artists/DPs/studios/movements tied to the topic)
- keywords (8-16 short, concrete, model-friendly tags that enforce the topic aesthetic; include terms like dreamy, photo-illustration hybrid, cinematic depth, selective focus, volumetric light, soft bokeh, film grain, painterly details when appropriate)
- negativeKeywords (12-20 strong blockers for any text or bland/generic looks; include: text, caption, subtitles, watermark, logo, signature, letters, words, typography, graphic design, poster, diagram, chart, meme, UI, interface, screenshot, map, sign, signage, flat vector, clip art, corporate illustration, over-sharpened, uncanny valley)
Aspect may be set if relevant.
Consider these concept titles: ${titles ?? "(not provided)"}.
Return only the JSON.`;
}

// Shared clauses/negatives
export const NO_TEXT_CLAUSE =
  "No text, no captions, no subtitles, no watermarks, no logos, no signatures.";

export const STRONG_NO_TEXT =
  "no text, no caption, no subtitles, no watermark, no logo, no signature, no letters, no words, no typography, no UI, no interface, no signs, no signage";

export const STRONG_NEGATIVE =
  "text, caption, subtitles, watermark, logo, signature, letters, words, typography, graphic design, poster, diagram, chart, meme, ui, interface, screenshot, map, sign, signage, flat vector, clip art, corporate illustration";

export function buildImagePromptFromStyle(params: {
  title: string;
  topic: string;
  style: StyleGuide;
}): string {
  const { title, topic, style } = params;
  const palette = (style.palette || [])
    .map((c) => c.hex)
    .slice(0, 4)
    .join(", ");
  const influences = (style.influences || []).slice(0, 4).join(", ");
  const pos = (style.keywords || []).slice(0, 12).join(", ");
  const neg = (
    style.negativeKeywords || [
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

  return `${title} — topic: ${topic}. A midjourney-esque dreamy photo-illustration hybrid with cinematic depth, selective focus, volumetric light, subtle film grain, painterly details. Random level of softness / bokeh / blur between 0 and 10. Style: ${
    style.medium
  }${style.camera ? ", " + style.camera : ""}, ${style.lighting}, ${
    style.composition
  }${
    style.texture ? ", " + style.texture : ""
  }, palette ${palette}; influences ${influences}; ${pos}. ${NO_TEXT_CLAUSE} Negative: ${neg}.`;
}

export function buildFallbackImagePrompt(title: string, topic: string): string {
  return `High-quality illustration for "${title}" — topic: "${topic}". Dreamy photo-illustration hybrid, cinematic depth, selective focus, volumetric light, soft bokeh, subtle film grain, painterly details. ${NO_TEXT_CLAUSE}`;
}
