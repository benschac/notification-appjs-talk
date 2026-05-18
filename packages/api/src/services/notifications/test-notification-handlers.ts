import {
  DOMAIN_EVENTS,
  eventBus,
  type TypedEventBus,
} from "../../events/simple-event-bus";
import { NOTIFICATION_TYPES } from "./notification-types";
import type { NotificationService } from "./unified-notification.service";

export function setupTestNotificationHandlers(
  notificationService: NotificationService,
  events: TypedEventBus = eventBus,
  options?: {
    logSlideChanges?: boolean;
  }
) {
  events.on(DOMAIN_EVENTS.NOTIFICATIONS.TEST_REQUESTED, async (payload) => {
    await notificationService.send(
      payload.userId,
      payload.notificationType ?? NOTIFICATION_TYPES.TEST_NOTIFICATION,
      {
        push: {
          title: payload.title,
          body: payload.body ?? "This is a demo notification from the talk API package.",
          data: {
            ...payload.data,
            notification_type: payload.notificationType,
            source: "talk-demo",
          },
          sound: "default",
        },
      },
      {
        eventId: payload.eventId,
      }
    );
  });

  events.on(DOMAIN_EVENTS.TALK.SLIDE_CHANGED, async (payload) => {
    if (options?.logSlideChanges) {
      console.log(
        `[talk-demo] slide changed: ${payload.slide.slideIndex + 1}/${payload.slide.slideCount} ${payload.slide.title}`
      );
    }
  });
}
