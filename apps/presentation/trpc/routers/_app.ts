import { z } from "zod";

import { baseProcedure, createTRPCRouter } from "../init";
import { talkRouter } from "./talk";

export const appRouter = createTRPCRouter({
  health: baseProcedure
    .input(
      z
        .object({
          text: z.string().optional(),
        })
        .optional()
    )
    .query(({ ctx, input }) => {
      return {
        ok: true,
        greeting: `hello ${input?.text ?? "presentation"}`,
        requestId: ctx.requestId,
      };
    }),
  talk: talkRouter,
});

export type AppRouter = typeof appRouter;
