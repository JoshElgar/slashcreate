import { z } from "zod";
import { procedure, router } from "../trpc";
import {
  createPredictionForModel,
  getPrediction,
  waitForPrediction,
} from "../replicate";
import { StyleGuide } from "@/types/style";

const ConceptsSchema = z.object({
  concepts: z
    .array(
      z.object({
        title: z.string(),
        paragraphs: z.array(z.string()).length(1),
      })
    )
    .min(1),
});

export const generationRouter = router({
  generateConcepts: procedure
    .input(
      z.object({
        topic: z.string().min(1),
        count: z.number().min(1).max(100).default(12),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt =
        'You are generating book content. The tone should be accessible and informalm but informed. It is not an informational brochure - it\'s an interesting book written by a friend who knows a lot about the topic and is explaining the most interesting things to you in a professional way. Return strict JSON only. No prose. JSON shape: {\n  "concepts": [ { "title": string, "paragraphs": string[1] } ]\n}';
      const userPrompt = `Topic: ${input.topic}. Generate ${input.count} diverse concepts that perfectly encapsulate the topic and highlight the most interesting aspects. It's important they paint a cohesive picture when all put together - there should be shared conceptual threads woven throughout. For each, return: title (<=7 words), paragraphs (array with 1 paragraph, 100 words max). Return only JSON: { concepts: { title: string, paragraphs: string[1] }[] }.`;

      // Minimal input contract for Replicate OpenAI GPT-5 runner
      console.log(
        "Creating concept generation prediction for topic:",
        input.topic
      );
      const prediction = await createPredictionForModel("openai/gpt-5", {
        system_prompt: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
      });

      const completed = await waitForPrediction(prediction.id, {
        intervalMs: 1200,
        maxMs: 90_000,
      });

      if (completed.status !== "succeeded") {
        throw new Error(
          `Concept generation failed: ${completed.error ?? completed.status}`
        );
      }

      // Replicate output could be string or array; we expect JSON string here
      let text = "";
      if (typeof completed.output === "string") {
        text = completed.output;
      } else if (Array.isArray(completed.output)) {
        // Some models stream arrays of strings
        text = completed.output.join("");
      } else if (completed.output != null) {
        text = String(completed.output);
      }

      const parsed = ConceptsSchema.parse(JSON.parse(text));

      return {
        concepts: parsed.concepts,
      };
    }),

  generateStyleGuide: procedure
    .input(
      z.object({
        topic: z.string().min(1),
        conceptTitles: z.array(z.string()).min(1).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const StyleSchema = z.object({
        palette: z
          .array(
            z.object({
              name: z.string().optional(),
              hex: z.string().regex(/^#?[0-9A-Fa-f]{6}$/),
            })
          )
          .min(3)
          .max(8),
        lighting: z.string(),
        medium: z.string(),
        composition: z.string(),
        camera: z.string().optional().nullable(),
        texture: z.string().optional().nullable(),
        influences: z.array(z.string()).min(1).max(6),
        keywords: z.array(z.string()).min(4).max(16),
        negativeKeywords: z.array(z.string()).min(4).max(20),
        aspect: z.string().optional(),
      });

      const systemPrompt =
        'You are an expert art director. Return strict JSON only. No prose. JSON shape: {"palette": {"hex": string}[], "lighting": string, "medium": string, "composition": string, "camera"?: string|null, "texture"?: string, "influences": string[], "keywords": string[], "negativeKeywords": string[], "aspect"?: string}';

      const titles = input.conceptTitles?.slice(0, 12).join("; ");
      const userPrompt = `Topic: ${input.topic}. Create a very specific, unmistakably topic-driven visual style guide that a diffusion model can follow across many images.
Include signature visual cues from the topic (era, place, franchise, movement, materials, production design, motifs, weather, mood). If the topic implies a strong aesthetic (e.g., cyberpunk neon rain, noir lighting, retro-futurism), encode that explicitly.
Provide:
- palette (3-8 cohesive hex colors that match the topic)
- lighting (concise, cinematic/photographic lighting description)
- medium (e.g., cinematic key art, stylized concept art, analog film photo, matte painting)
- composition (framing rules and shot style)
- camera (optional lenses/sensors/film if relevant)
- texture (optional surface/material/film grain)
- influences (2-6 highly relevant artists/DPs/studios/movements tied to the topic)
- keywords (8-16 short, concrete, model-friendly tags that enforce the topic aesthetic)
- negativeKeywords (12-20 strong blockers for any text or bland/generic looks; include: text, caption, subtitles, watermark, logo, signature, letters, words, typography, graphic design, poster, diagram, chart, meme, UI, interface, screenshot, map, sign, signage, flat vector, clip art, corporate illustration)
Aspect may be set if relevant.
Consider these concept titles: ${titles ?? "(not provided)"}.
Return only the JSON.`;

      console.log(
        "Creating style guide generation prediction for topic:",
        input.topic
      );
      const prediction = await createPredictionForModel("openai/gpt-5", {
        system_prompt: systemPrompt,
        prompt: userPrompt,
        temperature: 0.6,
      });

      const completed = await waitForPrediction(prediction.id, {
        intervalMs: 1200,
        maxMs: 60_000,
      });

      if (completed.status !== "succeeded") {
        throw new Error(
          `Style guide generation failed: ${
            completed.error ?? completed.status
          }`
        );
      }

      const text =
        typeof completed.output === "string"
          ? completed.output
          : Array.isArray(completed.output)
          ? completed.output.join("")
          : String(completed.output ?? "");

      const parsed = StyleSchema.parse(JSON.parse(text));

      // Normalize hex values to #RRGGBB
      const palette = parsed.palette.map((c) => ({
        name: c.name,
        hex: c.hex.startsWith("#") ? c.hex : `#${c.hex}`,
      }));

      const result: StyleGuide = { ...parsed, palette } as StyleGuide;
      return { style: result };
    }),

  startImagePredictions: procedure
    .input(
      z.object({
        items: z.array(
          z.object({
            conceptId: z.string(),
            prompt: z.string().min(1),
          })
        ),
        quality: z.enum(["low", "high"]).default("low"),
      })
    )
    .mutation(async ({ input }) => {
      const started: { conceptId: string; predictionId: string }[] = [];
      const strongNoText =
        "no text, no caption, no subtitles, no watermark, no logo, no signature, no letters, no words, no typography, no UI, no interface, no signs, no signage";
      const strongNegative =
        "text, caption, subtitles, watermark, logo, signature, letters, words, typography, graphic design, poster, diagram, chart, meme, ui, interface, screenshot, map, sign, signage, flat vector, clip art, corporate illustration";

      for (const item of input.items) {
        const composedPrompt = `${item.prompt}. ${strongNoText}`;
        console.log("Creating image prediction for concept:", item.conceptId);
        const model =
          input.quality === "high"
            ? "google/imagen-4-fast"
            : "black-forest-labs/flux-schnell";
        const inputPayload: Record<string, unknown> = {
          prompt: composedPrompt,
          aspect_ratio: "9:16",
        };
        // Provide model-specific negative prompts where supported
        if (model === "black-forest-labs/flux-schnell") {
          (inputPayload as any).negative_prompt = strongNegative;
        }
        const p = await createPredictionForModel(model, inputPayload);
        started.push({ conceptId: item.conceptId, predictionId: p.id });
      }
      return { started };
    }),

  checkImagePredictions: procedure
    .input(
      z.object({
        items: z.array(
          z.object({
            conceptId: z.string(),
            predictionId: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const completed: { conceptId: string; imageUrl: string }[] = [];
      const pending: { conceptId: string; predictionId: string }[] = [];
      const failed: { conceptId: string; error: string }[] = [];

      for (const item of input.items) {
        const p = await getPrediction(item.predictionId);
        if (p.status === "succeeded") {
          // Handle various output shapes (array of URLs, single URL string, or object with url)
          let url: string | undefined;
          if (Array.isArray(p.output)) {
            const first = p.output[0] as unknown;
            if (typeof first === "string") url = first;
            else if (
              first &&
              typeof first === "object" &&
              "url" in (first as any)
            )
              url = String((first as any).url);
          } else if (typeof p.output === "string") {
            url = p.output;
          } else if (p.output && typeof p.output === "object") {
            const maybeUrl = (p.output as any).url;
            if (maybeUrl) url = String(maybeUrl);
          }
          if (!url) {
            failed.push({
              conceptId: item.conceptId,
              error: "No image URL in output",
            });
          } else {
            completed.push({ conceptId: item.conceptId, imageUrl: url });
          }
        } else if (p.status === "failed" || p.status === "canceled") {
          failed.push({
            conceptId: item.conceptId,
            error: p.error ?? p.status,
          });
        } else {
          pending.push({
            conceptId: item.conceptId,
            predictionId: item.predictionId,
          });
        }
      }

      return { completed, pending, failed };
    }),
});
