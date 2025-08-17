import { z } from "zod";
import { procedure, router } from "../trpc";
import {
  createPredictionForModel,
  getPrediction,
  waitForPrediction,
} from "../replicate";
import { StyleGuide } from "@/types/style";
import {
  CONCEPTS_SYSTEM_PROMPT,
  STYLE_GUIDE_SYSTEM_PROMPT,
  buildConceptsUserPrompt,
  buildStyleGuideUserPrompt,
  STRONG_NEGATIVE,
  STRONG_NO_TEXT,
} from "@/lib/prompts";
import { parseFirstJson } from "../../utils/json";

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
      const systemPrompt = CONCEPTS_SYSTEM_PROMPT;
      const userPrompt = buildConceptsUserPrompt(input.topic, input.count);

      console.log(
        "Creating concept generation prediction for topic:",
        input.topic
      );
      const prediction = await createPredictionForModel(
        "anthropic/claude-4-sonnet",
        {
          system_prompt: systemPrompt,
          prompt: userPrompt,
        }
      );

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

      const parsed = ConceptsSchema.parse(parseFirstJson(text));

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

      const systemPrompt = STYLE_GUIDE_SYSTEM_PROMPT;
      const userPrompt = buildStyleGuideUserPrompt(
        input.topic,
        input.conceptTitles
      );

      console.log(
        "Creating style guide generation prediction for topic:",
        input.topic
      );
      const prediction = await createPredictionForModel(
        "anthropic/claude-4-sonnet",
        {
          system_prompt: systemPrompt,
          prompt: userPrompt,
        }
      );

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

      const parsed = StyleSchema.parse(parseFirstJson(text));

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

      for (const item of input.items) {
        const composedPrompt = `${item.prompt}. ${STRONG_NO_TEXT}`;
        console.log("Creating image prediction for concept:", item.conceptId);
        const model =
          input.quality === "high"
            ? "ideogram-ai/ideogram-v3-turbo"
            : "black-forest-labs/flux-schnell";
        const inputPayload: Record<string, unknown> = {
          prompt: composedPrompt,
          aspect_ratio: "9:16",
        };
        // Provide model-specific negative prompts where supported
        if (model === "black-forest-labs/flux-schnell") {
          (inputPayload as any).negative_prompt = STRONG_NEGATIVE;
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
