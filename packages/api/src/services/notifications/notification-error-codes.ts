export const NOTIFICATION_ERROR_CODES = {
  INVALID_TOKEN: "invalid_token",
  NO_INSTALLS: "no_installs",
  NO_VALID_TOKENS: "no_valid_tokens",
  PAYLOAD_INVALID: "payload_invalid",
  PROVIDER_OUTAGE: "provider_outage",
  PROVIDER_REJECTED: "provider_rejected",
  RATE_LIMITED: "rate_limited",
  TRANSIENT: "transient",
  UNKNOWN: "unknown",
} as const;

export type NotificationErrorCode =
  (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES];
