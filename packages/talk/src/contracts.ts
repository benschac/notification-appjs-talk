import { z } from "zod";

export const liveActivityPlatformSchema = z.enum(["ios"]);

export const talkSessionIdSchema = z.string().min(1);

export const talkSlideStateSchema = z.object({
  talkId: z.string().min(1),
  slideIndex: z.number().int().nonnegative(),
  slideCount: z.number().int().positive(),
  title: z.string().min(1).max(160),
  section: z.string().max(100).optional(),
  takeaway: z.string().max(240).optional(),
  updatedAt: z.string().datetime(),
  deepLink: z.string().max(300).optional(),
});

export const startTalkInputSchema = z.object({
  talkSlug: z.string().min(1).default("appjs-2026"),
});

export const currentTalkStateInputSchema = z.object({
  sessionId: talkSessionIdSchema,
});

export const liveActivityTokenRegistrationSchema = z.object({
  sessionId: talkSessionIdSchema,
  activityId: z.string().min(1),
  pushToken: z.string().min(1),
  platform: liveActivityPlatformSchema,
});

export const slideChangedInputSchema = z.object({
  sessionId: talkSessionIdSchema,
  slide: talkSlideStateSchema,
});

export const endTalkInputSchema = z.object({
  sessionId: talkSessionIdSchema,
  finalSlide: talkSlideStateSchema.optional(),
});

export type LiveActivityPlatform = z.infer<typeof liveActivityPlatformSchema>;
export type TalkSessionId = z.infer<typeof talkSessionIdSchema>;
export type TalkSlideState = z.infer<typeof talkSlideStateSchema>;
export type StartTalkInput = z.infer<typeof startTalkInputSchema>;
export type CurrentTalkStateInput = z.infer<typeof currentTalkStateInputSchema>;
export type LiveActivityTokenRegistration = z.infer<
  typeof liveActivityTokenRegistrationSchema
>;
export type SlideChangedInput = z.infer<typeof slideChangedInputSchema>;
export type EndTalkInput = z.infer<typeof endTalkInputSchema>;
