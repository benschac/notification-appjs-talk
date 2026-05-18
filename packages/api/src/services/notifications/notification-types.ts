export const NOTIFICATION_TYPES = Object.freeze({
  TEST_NOTIFICATION: "test_notification",
  TALK_SLIDE_CHANGED: "talk_slide_changed",
  LIVE_ACTIVITY_TEST: "live_activity_test",
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze( [
  NOTIFICATION_TYPES.TEST_NOTIFICATION,
  NOTIFICATION_TYPES.TALK_SLIDE_CHANGED,
  NOTIFICATION_TYPES.LIVE_ACTIVITY_TEST,
])

export type NotificationTypeKey =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
