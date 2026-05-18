import { talkSlideStateSchema } from "@repo/talk/contracts";
import { z } from "zod";

import { NOTIFICATION_TYPE_VALUES } from "../services/notifications/notification-types";

export const DOMAIN_EVENTS = {
  TALK: {
    SLIDE_CHANGED: "talk.slide_changed",
  },
  NOTIFICATIONS: {
    TEST_REQUESTED: "notifications.test_requested",
  },
  NOTIFICATION: {
    DELIVERED: "notification.delivered",
    FAILED: "notification.failed",
    SKIPPED: "notification.skipped",
  },
  SYSTEM: {
    ERROR: "system.error",
  },
} as const;

const notificationTypeSchema = z.enum(NOTIFICATION_TYPE_VALUES);

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ])
);

const jsonRecordSchema = z.record(z.string(), jsonSchema);

export const domainEventSchemas = {
  [DOMAIN_EVENTS.TALK.SLIDE_CHANGED]: {
    payload: z.object({
      sessionId: z.string().min(1),
      slide: talkSlideStateSchema,
      liveActivityTokenCount: z.number().int().nonnegative().default(0),
    }),
  },
  [DOMAIN_EVENTS.NOTIFICATIONS.TEST_REQUESTED]: {
    payload: z.object({
      userId: z.string().min(1),
      notificationType: notificationTypeSchema.default("test_notification"),
      title: z.string().min(1).max(200).default("Test notification"),
      body: z.string().max(1800).optional(),
      data: jsonRecordSchema.optional(),
    }),
  },
  [DOMAIN_EVENTS.NOTIFICATION.DELIVERED]: {
    payload: z.object({
      userId: z.string().min(1),
      notificationType: notificationTypeSchema,
      channel: z.enum(["push"]),
      providerId: z.string().optional(),
      metadata: jsonRecordSchema.optional(),
    }),
  },
  [DOMAIN_EVENTS.NOTIFICATION.FAILED]: {
    payload: z.object({
      userId: z.string().min(1),
      notificationType: notificationTypeSchema,
      channel: z.enum(["push"]),
      error: z.string(),
      errorCode: z.string().optional(),
      metadata: jsonRecordSchema.optional(),
    }),
  },
  [DOMAIN_EVENTS.NOTIFICATION.SKIPPED]: {
    payload: z.object({
      userId: z.string().min(1),
      notificationType: notificationTypeSchema,
      channel: z.enum(["push"]),
      reason: z.string(),
      metadata: jsonRecordSchema.optional(),
    }),
  },
  [DOMAIN_EVENTS.SYSTEM.ERROR]: {
    payload: z.object({
      context: z.string(),
      error: z.unknown(),
      metadata: jsonRecordSchema.optional(),
      occurredAt: z.string().datetime().default(() => new Date().toISOString()),
    }),
  },
} as const;

export type DomainEventName = keyof typeof domainEventSchemas;

export type DomainEvents = {
  [EventName in DomainEventName]: z.infer<(typeof domainEventSchemas)[EventName]["payload"]>;
};

export type EventMetadata<EventName extends DomainEventName = DomainEventName> = {
  eventType: EventName;
  emittedAt: string;
  eventId: string;
};

export type EnrichedDomainEvent<EventName extends DomainEventName> =
  DomainEvents[EventName] & EventMetadata<EventName>;
