import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { baseProcedure, createTRPCRouter } from "../init";

const liveActivityPlatformSchema = z.enum(["ios"]);

const talkSlideStateSchema = z.object({
  talkId: z.string().min(1),
  slideIndex: z.number().int().nonnegative(),
  slideCount: z.number().int().positive(),
  title: z.string().min(1).max(160),
  section: z.string().max(100).optional(),
  takeaway: z.string().max(240).optional(),
  updatedAt: z.string().datetime(),
  deepLink: z.string().max(300).optional(),
});

const tokenRegistrationSchema = z.object({
  sessionId: z.string().min(1),
  activityId: z.string().min(1),
  pushToken: z.string().min(1),
  platform: liveActivityPlatformSchema,
});

type TalkSlideState = z.infer<typeof talkSlideStateSchema>;
type LiveActivityTokenRegistration = z.infer<typeof tokenRegistrationSchema>;

type TalkSession = {
  id: string;
  talkSlug: string;
  createdAt: string;
  endedAt: string | null;
  latestSlide: TalkSlideState | null;
  liveActivityTokens: Map<string, LiveActivityTokenRegistration & { registeredAt: string }>;
};

const talkSessions = new Map<string, TalkSession>();

const serializeSession = (session: TalkSession) => ({
  id: session.id,
  talkSlug: session.talkSlug,
  createdAt: session.createdAt,
  endedAt: session.endedAt,
  latestSlide: session.latestSlide,
  liveActivityTokenCount: session.liveActivityTokens.size,
});

const getSessionOrThrow = (sessionId: string) => {
  const session = talkSessions.get(sessionId);

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Talk session not found",
    });
  }

  return session;
};

export const talkRouter = createTRPCRouter({
  start: baseProcedure
    .input(
      z.object({
        talkSlug: z.string().min(1).default("appjs-2026"),
      })
    )
    .mutation(({ input }) => {
      const session: TalkSession = {
        id: crypto.randomUUID(),
        talkSlug: input.talkSlug,
        createdAt: new Date().toISOString(),
        endedAt: null,
        latestSlide: null,
        liveActivityTokens: new Map(),
      };

      talkSessions.set(session.id, session);

      return serializeSession(session);
    }),

  currentState: baseProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
      })
    )
    .query(({ input }) => {
      return serializeSession(getSessionOrThrow(input.sessionId));
    }),

  registerLiveActivityToken: baseProcedure
    .input(tokenRegistrationSchema)
    .mutation(({ input }) => {
      const session = getSessionOrThrow(input.sessionId);
      const registeredAt = new Date().toISOString();

      session.liveActivityTokens.set(input.activityId, {
        ...input,
        registeredAt,
      });

      return {
        sessionId: session.id,
        activityId: input.activityId,
        registeredAt,
        liveActivityTokenCount: session.liveActivityTokens.size,
      };
    }),

  slideChanged: baseProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
        slide: talkSlideStateSchema,
      })
    )
    .mutation(({ input }) => {
      const session = getSessionOrThrow(input.sessionId);
      session.latestSlide = input.slide;

      return {
        session: serializeSession(session),
        liveActivityTokenCount: session.liveActivityTokens.size,
      };
    }),

  end: baseProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
        finalSlide: talkSlideStateSchema.optional(),
      })
    )
    .mutation(({ input }) => {
      const session = getSessionOrThrow(input.sessionId);
      session.endedAt = new Date().toISOString();

      if (input.finalSlide) {
        session.latestSlide = input.finalSlide;
      }

      return serializeSession(session);
    }),
});
