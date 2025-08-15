import { z } from "zod";
import { procedure, router } from "../trpc";
import {
  createPredictionForModel,
  getPrediction,
  waitForPrediction,
} from "../replicate";

const ConceptsSchema = z.object({
  concepts: z
    .array(
      z.object({
        title: z.string(),
        paragraphs: z.array(z.string()).length(4),
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
      const userPrompt = `Topic: ${input.topic}. Generate ${input.count} diverse concepts reflecting cuisine, history, culture, geography, daily life, arts, architecture, notable figures, and customs. For each, return: title (<=7 words), paragraphs (array with 1 paragraph, 100 words max). Return only JSON: { concepts: { title: string, paragraphs: string[1] }[] }.`;

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
        const p = await createPredictionForModel(
          "black-forest-labs/flux-schnell",
          {
            prompt: item.prompt,
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
