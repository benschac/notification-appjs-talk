import {
  NOTIFICATION_ERROR_CODES,
  type NotificationErrorCode,
} from "../notification-error-codes";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type NotificationPayload = {
  title?: string;
  body?: string;
  data?: Record<string, JsonValue | undefined>;
  sound?: "default" | null;
  badge?: number;
  ttl?: number;
  expiration?: number;
  priority?: "default" | "normal" | "high";
  subtitle?: string;
  channelId?: string;
};

export type ExpoPushMessage = NotificationPayload & {
  to: string;
};

export type ExpoPushTicket =
  | {
      status: "ok";
      id?: string;
    }
  | {
      status: "error";
      message: string;
      details?: {
        error?: string;
      };
    };

const isErrorTicket = (
  ticket: ExpoPushTicket
): ticket is Extract<ExpoPushTicket, { status: "error" }> => ticket.status === "error";

export interface SingleNotification {
  userId: string;
  payload: NotificationPayload;
}

export interface BatchNotification {
  userIds: string[];
  payload: NotificationPayload;
}

export interface NotificationResult {
  success: boolean;
  ticket?: ExpoPushTicket;
  ticketId?: string;
  error?: string;
  errorCode?: NotificationErrorCode;
}

export interface BatchNotificationResult {
  results: {
    userId: string;
    success: boolean;
    ticket?: ExpoPushTicket;
    ticketId?: string;
    error?: string;
    errorCode?: NotificationErrorCode;
  }[];
  totalSent: number;
  totalFailed: number;
}

export type RegisteredPushToken = {
  userId: string;
  token: string;
  deviceId?: string;
  registeredAt: string;
};

export interface PushTokenStore {
  register(token: RegisteredPushToken): Promise<void>;
  remove(userId: string, token: string): Promise<void>;
  listByUser(userId: string): Promise<RegisteredPushToken[]>;
  listByUsers(userIds: string[]): Promise<Map<string, RegisteredPushToken[]>>;
}

export interface PushTransport {
  send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]>;
}

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_CHUNK_SIZE = 100;
const DEFAULT_PUSH_SEND_MAX_ATTEMPTS = 2;
const DEFAULT_PUSH_SEND_BASE_DELAY_MS = 300;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isExpoPushToken = (token: string) =>
  /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token);

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const normalizeMessage = (message?: string): string => (message ?? "").trim().toLowerCase();

const matchesAny = (message: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => message.includes(pattern));

const errorCodePatterns = {
  invalidToken: [
    "expopushtoken",
    "devicenotregistered",
    "not registered",
    "invalidregistration",
    "notregistered",
    "baddevicetoken",
    "invalid token",
  ],
  rateLimited: ["message rate exceeded", "rate limit", "too many requests", "429"],
  payloadInvalid: ["message too big", "invalid message", "payload"],
  providerRejected: ["invalid credentials", "unauthorized", "forbidden"],
  providerOutage: ["service unavailable", "server error", "500", "502", "503", "504"],
  transient: ["timeout", "econnreset", "epipe", "network", "socket hang up"],
} as const;

export const maskPushToken = (token: string): string =>
  token.length > 20 ? `${token.slice(0, 20)}...` : token;

export const resolveNotificationErrorCode = (message?: string): NotificationErrorCode => {
  const normalized = normalizeMessage(message);

  if (!normalized) {
    return NOTIFICATION_ERROR_CODES.UNKNOWN;
  }

  if (matchesAny(normalized, errorCodePatterns.invalidToken)) {
    return NOTIFICATION_ERROR_CODES.INVALID_TOKEN;
  }

  if (matchesAny(normalized, errorCodePatterns.rateLimited)) {
    return NOTIFICATION_ERROR_CODES.RATE_LIMITED;
  }

  if (matchesAny(normalized, errorCodePatterns.payloadInvalid)) {
    return NOTIFICATION_ERROR_CODES.PAYLOAD_INVALID;
  }

  if (matchesAny(normalized, errorCodePatterns.providerRejected)) {
    return NOTIFICATION_ERROR_CODES.PROVIDER_REJECTED;
  }

  if (matchesAny(normalized, errorCodePatterns.providerOutage)) {
    return NOTIFICATION_ERROR_CODES.PROVIDER_OUTAGE;
  }

  if (matchesAny(normalized, errorCodePatterns.transient)) {
    return NOTIFICATION_ERROR_CODES.TRANSIENT;
  }

  return NOTIFICATION_ERROR_CODES.UNKNOWN;
};

const isRetryableErrorCode = (errorCode?: NotificationErrorCode): boolean =>
  errorCode === NOTIFICATION_ERROR_CODES.TRANSIENT ||
  errorCode === NOTIFICATION_ERROR_CODES.RATE_LIMITED ||
  errorCode === NOTIFICATION_ERROR_CODES.PROVIDER_OUTAGE;

export class InMemoryPushTokenStore implements PushTokenStore {
  private tokensByUser = new Map<string, Map<string, RegisteredPushToken>>();

  async register(token: RegisteredPushToken): Promise<void> {
    const userTokens = this.tokensByUser.get(token.userId) ?? new Map<string, RegisteredPushToken>();
    userTokens.set(token.token, token);
    this.tokensByUser.set(token.userId, userTokens);
  }

  async remove(userId: string, token: string): Promise<void> {
    this.tokensByUser.get(userId)?.delete(token);
  }

  async listByUser(userId: string): Promise<RegisteredPushToken[]> {
    return Array.from(this.tokensByUser.get(userId)?.values() ?? []);
  }

  async listByUsers(userIds: string[]): Promise<Map<string, RegisteredPushToken[]>> {
    const result = new Map<string, RegisteredPushToken[]>();

    for (const userId of userIds) {
      result.set(userId, await this.listByUser(userId));
    }

    return result;
  }
}

export class ExpoPushHttpTransport implements PushTransport {
  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const responseBody = (await response.json()) as {
      data?: ExpoPushTicket[];
      errors?: Array<{ message?: string }>;
    };

    if (!response.ok) {
      const message = responseBody.errors?.[0]?.message ?? `Expo push failed: ${response.status}`;
      throw new Error(message);
    }

    return responseBody.data ?? [];
  }
}

export class DryRunPushTransport implements PushTransport {
  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    return messages.map((message, index) => ({
      status: "ok",
      id: `dry-run:${maskPushToken(message.to)}:${index}`,
    }));
  }
}

export class PushNotificationService {
  constructor(
    private readonly tokenStore: PushTokenStore = new InMemoryPushTokenStore(),
    private readonly transport: PushTransport = new ExpoPushHttpTransport()
  ) {}

  async registerToken(input: {
    userId: string;
    token: string;
    deviceId?: string;
  }): Promise<RegisteredPushToken> {
    const registeredToken: RegisteredPushToken = {
      userId: input.userId,
      token: input.token,
      deviceId: input.deviceId,
      registeredAt: new Date().toISOString(),
    };

    await this.tokenStore.register(registeredToken);
    return registeredToken;
  }

  async removeToken(userId: string, token: string): Promise<void> {
    await this.tokenStore.remove(userId, token);
  }

  async sendToUser(input: SingleNotification): Promise<NotificationResult> {
    const tokens = await this.tokenStore.listByUser(input.userId);

    if (tokens.length === 0) {
      return {
        success: false,
        error: "No push tokens registered for user",
        errorCode: NOTIFICATION_ERROR_CODES.NO_INSTALLS,
      };
    }

    const validTokens = tokens.filter(({ token }) => isExpoPushToken(token));

    if (validTokens.length === 0) {
      return {
        success: false,
        error: "No valid Expo push tokens registered for user",
        errorCode: NOTIFICATION_ERROR_CODES.NO_VALID_TOKENS,
      };
    }

    const batchResult = await this.sendDirectToTokens(
      validTokens.map(({ token }) => token),
      input.payload
    );

    const firstSuccess = batchResult.results.find((result) => result.success);

    if (firstSuccess) {
      return {
        success: true,
        ticket: firstSuccess.ticket,
        ticketId: firstSuccess.ticketId,
      };
    }

    const firstFailure = batchResult.results[0];

    return {
      success: false,
      error: firstFailure?.error ?? "Push send failed",
      errorCode: firstFailure?.errorCode ?? NOTIFICATION_ERROR_CODES.UNKNOWN,
    };
  }

  async sendToMultipleUsers(notifications: BatchNotification[]): Promise<BatchNotificationResult> {
    const userIds = Array.from(
      new Set(notifications.flatMap((notification) => notification.userIds))
    );
    const tokensByUser = await this.tokenStore.listByUsers(userIds);
    const results: BatchNotificationResult["results"] = [];

    for (const notification of notifications) {
      for (const userId of notification.userIds) {
        const validTokens = (tokensByUser.get(userId) ?? []).filter(({ token }) =>
          isExpoPushToken(token)
        );

        if (validTokens.length === 0) {
          results.push({
            userId,
            success: false,
            error: "No valid Expo push tokens registered for user",
            errorCode: NOTIFICATION_ERROR_CODES.NO_VALID_TOKENS,
          });
          continue;
        }

        const directResult = await this.sendDirectToTokens(
          validTokens.map(({ token }) => token),
          notification.payload
        );
        const success = directResult.results.find((result) => result.success);
        const failure = directResult.results.find((result) => !result.success);

        results.push({
          userId,
          success: Boolean(success),
          ticket: success?.ticket,
          ticketId: success?.ticketId,
          error: success ? undefined : failure?.error,
          errorCode: success ? undefined : failure?.errorCode,
        });
      }
    }

    return {
      results,
      totalSent: results.filter((result) => result.success).length,
      totalFailed: results.filter((result) => !result.success).length,
    };
  }

  async sendDirectToTokens(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<{
    results: Array<{
      token: string;
      success: boolean;
      ticket?: ExpoPushTicket;
      ticketId?: string;
      error?: string;
      errorCode?: NotificationErrorCode;
    }>;
    totalSent: number;
    totalFailed: number;
  }> {
    const uniqueTokens = Array.from(new Set(tokens));
    const messages = uniqueTokens.map((token) => ({
      ...payload,
      to: token,
    }));
    const results: Awaited<ReturnType<PushNotificationService["sendDirectToTokens"]>>["results"] =
      [];

    for (const messageChunk of chunk(messages, EXPO_PUSH_CHUNK_SIZE)) {
      const tickets = await this.sendChunkWithRetry(messageChunk);

      messageChunk.forEach((message, index) => {
        const ticket = tickets[index];
        const error = ticket?.status === "error" ? ticket.message : undefined;
        const errorCode = error ? resolveNotificationErrorCode(error) : undefined;

        results.push({
          token: message.to,
          success: ticket?.status === "ok",
          ticket,
          ticketId: ticket?.status === "ok" ? ticket.id : undefined,
          error,
          errorCode,
        });
      });
    }

    return {
      results,
      totalSent: results.filter((result) => result.success).length,
      totalFailed: results.filter((result) => !result.success).length,
    };
  }

  private async sendChunkWithRetry(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= DEFAULT_PUSH_SEND_MAX_ATTEMPTS; attempt += 1) {
      try {
        const tickets = await this.transport.send(messages);
        const retryableTicket = tickets.find((ticket) => {
          if (!isErrorTicket(ticket)) {
            return false;
          }

          return isRetryableErrorCode(resolveNotificationErrorCode(ticket.message));
        });

        if (!retryableTicket) {
          return tickets;
        }

        lastError = new Error(
          isErrorTicket(retryableTicket) ? retryableTicket.message : "Push send failed"
        );
      } catch (error) {
        lastError = error;
        const errorCode = resolveNotificationErrorCode(
          error instanceof Error ? error.message : String(error)
        );

        if (!isRetryableErrorCode(errorCode)) {
          break;
        }
      }

      if (attempt < DEFAULT_PUSH_SEND_MAX_ATTEMPTS) {
        await sleep(DEFAULT_PUSH_SEND_BASE_DELAY_MS * attempt);
      }
    }

    const message = lastError instanceof Error ? lastError.message : "Push send failed";

    return messages.map(() => ({
      status: "error",
      message,
      details: {
        error: resolveNotificationErrorCode(message),
      },
    }));
  }
}
