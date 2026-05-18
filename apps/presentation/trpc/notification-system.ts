import "server-only";

import { createDemoNotificationSystem } from "@repo/api/notifications";

export const demoNotificationSystem = createDemoNotificationSystem({
  logSlideChanges: true,
  useDryRunPush: true,
});
