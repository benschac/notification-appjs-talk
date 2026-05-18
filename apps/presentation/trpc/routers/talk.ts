import { DOMAIN_EVENTS } from "@repo/api/events";
import {
  currentTalkStateInputSchema,
  endTalkInputSchema,
  liveActivityTokenRegistrationSchema,
  slideChangedInputSchema,
  startTalkInputSchema,
  type LiveActivityTokenRegistration,
  type TalkSlideState,
} from "@repo/talk/contracts";
import { TRPCError } from "@trpc/server";

import { demoNotificationSystem } from "../notification-system";
import { baseProcedure, createTRPCRouter } from "../init";

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
    .input(startTalkInputSchema)
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
    .input(currentTalkStateInputSchema)
    .query(({ input }) => {
      return serializeSession(getSessionOrThrow(input.sessionId));
    }),

  registerLiveActivityToken: baseProcedure
    .input(liveActivityTokenRegistrationSchema)
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
    .input(slideChangedInputSchema)
    .mutation(({ input }) => {
      const session = getSessionOrThrow(input.sessionId);
      session.latestSlide = input.slide;
      void demoNotificationSystem.events.emitAsync(DOMAIN_EVENTS.TALK.SLIDE_CHANGED, {
        sessionId: session.id,
        slide: input.slide,
        liveActivityTokenCount: session.liveActivityTokens.size,
      });

      return {
        session: serializeSession(session),
        liveActivityTokenCount: session.liveActivityTokens.size,
      };
    }),

  end: baseProcedure
    .input(endTalkInputSchema)
    .mutation(({ input }) => {
      const session = getSessionOrThrow(input.sessionId);
      session.endedAt = new Date().toISOString();

      if (input.finalSlide) {
        session.latestSlide = input.finalSlide;
      }

      return serializeSession(session);
    }),
});
