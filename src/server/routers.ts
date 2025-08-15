import { z } from "zod";
import { procedure, router } from "./trpc";
import { generationRouter } from "./routers/generation";

export const appRouter = router({
  hello: procedure
    .input(
      z.object({
        name: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.name ?? "World"}!`,
      };
    }),
  generation: generationRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
