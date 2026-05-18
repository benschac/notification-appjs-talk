import { eventBus, type TypedEventBus } from "../../events/simple-event-bus";
import {
  DryRunPushTransport,
  InMemoryPushTokenStore,
  PushNotificationService,
  type PushTransport,
} from "./push";
import { setupTestNotificationHandlers } from "./test-notification-handlers";
import { NotificationService } from "./unified-notification.service";

export function createDemoNotificationSystem(options?: {
  events?: TypedEventBus;
  logSlideChanges?: boolean;
  pushTransport?: PushTransport;
  useDryRunPush?: boolean;
}) {
  const events = options?.events ?? eventBus;
  const tokenStore = new InMemoryPushTokenStore();
  const pushTransport =
    options?.pushTransport ?? (options?.useDryRunPush ? new DryRunPushTransport() : undefined);
  const push = new PushNotificationService(tokenStore, pushTransport);
  const notifications = new NotificationService(push, events);

  setupTestNotificationHandlers(notifications, events, {
    logSlideChanges: options?.logSlideChanges,
  });

  return {
    events,
    notifications,
    push,
    tokenStore,
  };
}
