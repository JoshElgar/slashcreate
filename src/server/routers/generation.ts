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
        'You are generating book content. Return strict JSON only. No prose. JSON shape: {\n  "concepts": [ { "title": string, "paragraphs": string[1] } ]\n}';
      const userPrompt = `Topic: ${input.topic}. Generate ${input.count} diverse concepts that perfectly encapsulate the topic and highlight the most interesting aspects. It's important they paint a cohesive picture when all put together - there should be shared conceptual threads woven throughout. For each, return: title (<=7 words), paragraphs (array with 1 paragraph, 100 words max). Return only JSON: { concepts: { title: string, paragraphs: string[1] }[] }.`;

      // Minimal input contract for Replicate OpenAI GPT-5 runner
      const prediction = await createPredictionForModel("openai/gpt-5-nano", {
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

      let parsed: z.infer<typeof ConceptsSchema>;
      try {
        parsed = ConceptsSchema.parse(JSON.parse(text));
      } catch (err) {
        // Retry once with an explicit JSON reminder
        const retry = await createPredictionForModel("openai/gpt-5-nano", {
          prompt:
            userPrompt +
            "\nReturn only valid JSON. Do not include markdown. Ensure exactly 1 paragraph (max 100 words) per concept.",
          system_prompt: systemPrompt,
          temperature: 0.6,
        });
        const again = await waitForPrediction(retry.id, {
          intervalMs: 1200,
          maxMs: 90_000,
        });
        if (again.status !== "succeeded") {
          throw new Error(
            `Concept generation failed: ${again.error ?? again.status}`
          );
        }
        const outText =
          typeof again.output === "string"
            ? again.output
            : Array.isArray(again.output)
            ? again.output.join("")
            : String(again.output ?? "");
        parsed = ConceptsSchema.parse(JSON.parse(outText));
      }

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
      const userPrompt = `Topic: ${
        input.topic
      }. Create a concise, cohesive visual style guide that will produce elegant, high-quality images across multiple related concepts. If useful, consider these concept titles: ${
        titles ?? "(not provided)"
      }. Keep wording compact and model-friendly.`;

      const prediction = await createPredictionForModel("openai/gpt-5-nano", {
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

      let parsed: z.infer<typeof StyleSchema>;
      try {
        parsed = StyleSchema.parse(JSON.parse(text));
      } catch (err) {
        const retry = await createPredictionForModel("openai/gpt-5-nano", {
          system_prompt: systemPrompt,
          prompt: userPrompt + "\nReturn only valid JSON. No markdown.",
          temperature: 0.5,
        });
        const again = await waitForPrediction(retry.id, {
          intervalMs: 1200,
          maxMs: 60_000,
        });
        if (again.status !== "succeeded") {
          throw new Error(
            `Style guide generation failed: ${again.error ?? again.status}`
          );
        }
        const outText =
          typeof again.output === "string"
            ? again.output
            : Array.isArray(again.output)
            ? again.output.join("")
            : String(again.output ?? "");
        parsed = StyleSchema.parse(JSON.parse(outText));
      }

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
      })
    )
    .mutation(async ({ input }) => {
      const started: { conceptId: string; predictionId: string }[] = [];
      for (const item of input.items) {
        const composedPrompt = `${item.prompt}. no text`;
        const p = await createPredictionForModel(
          "black-forest-labs/flux-schnell",
          {
            prompt: composedPrompt,
            aspect_ratio: "9:16",
          }
        );
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
          // Flux Schnell often returns output as array of image URLs
          let url: string | undefined;
          if (Array.isArray(p.output)) {
            url = String(p.output[0]);
          } else if (typeof p.output === "string") {
            url = p.output;
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
