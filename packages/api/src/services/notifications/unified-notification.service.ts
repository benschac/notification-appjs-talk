import {
  DOMAIN_EVENTS,
  eventBus,
  type TypedEventBus,
} from "../../events/simple-event-bus";
import {
  NOTIFICATION_ERROR_CODES,
  type NotificationErrorCode,
} from "./notification-error-codes";
import type { NotificationTypeKey } from "./notification-types";
import type {
  BatchNotificationResult as PushBatchResult,
  NotificationPayload,
  PushNotificationService,
} from "./push";

export interface ChannelResult {
  channel: "push";
  success: boolean;
  id?: string;
  error?: string;
  errorCode?: NotificationErrorCode;
}

export interface NotificationResult {
  success: boolean;
  results: ChannelResult[];
}

export interface BatchNotificationResult {
  total: number;
  successful: number;
  failed: number;
  details: PromiseSettledResult<NotificationResult>[];
}

export type PushNotificationPayload = NotificationPayload;

export interface NotificationChannels {
  push?: PushNotificationPayload;
}

export interface NotificationRequest {
  userId: string;
  notificationType: NotificationTypeKey;
  channels: NotificationChannels;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  constructor(
    private readonly push: PushNotificationService,
    private readonly events: TypedEventBus = eventBus
  ) {}

  async send(
    userId: string,
    notificationType: NotificationTypeKey,
    channels: NotificationChannels,
    metadata?: Record<string, unknown>
  ): Promise<NotificationResult> {
    if (!channels.push) {
      await this.emitSkipped(userId, notificationType, "No push channel provided", metadata);
      return {
        success: false,
        results: [
          {
            channel: "push",
            success: false,
            error: "No notification channels provided",
            errorCode: NOTIFICATION_ERROR_CODES.UNKNOWN,
          },
        ],
      };
    }

    const pushResult = await this.push.sendToUser({
      userId,
      payload: channels.push,
    });

    const channelResult: ChannelResult = {
      channel: "push",
      success: pushResult.success,
      id: pushResult.ticketId,
      error: pushResult.error,
      errorCode: pushResult.errorCode,
    };

    if (channelResult.success) {
      await this.emitDelivered(userId, notificationType, channelResult.id, metadata);
    } else {
      await this.emitFailed(
        userId,
        notificationType,
        channelResult.error ?? "Push send failed",
        channelResult.errorCode,
        metadata
      );
    }

    return {
      success: channelResult.success,
      results: [channelResult],
    };
  }

  async sendBatch(notifications: NotificationRequest[]): Promise<BatchNotificationResult> {
    const details = await Promise.allSettled(
      notifications.map((notification) =>
        this.send(
          notification.userId,
          notification.notificationType,
          notification.channels,
          notification.metadata
        )
      )
    );

    return {
      total: notifications.length,
      successful: details.filter(
        (detail) => detail.status === "fulfilled" && detail.value.success
      ).length,
      failed: details.filter(
        (detail) => detail.status === "rejected" || !detail.value.success
      ).length,
      details,
    };
  }

  async sendPushBatch(
    notificationType: NotificationTypeKey,
    notifications: Array<{
      userIds: string[];
      payload: PushNotificationPayload;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<PushBatchResult> {
    const batchResult = await this.push.sendToMultipleUsers(notifications);

    await Promise.all(
      batchResult.results.map((result) => {
        if (result.success) {
          return this.emitDelivered(result.userId, notificationType, result.ticketId);
        }

        return this.emitFailed(
          result.userId,
          notificationType,
          result.error ?? "Push batch send failed",
          result.errorCode
        );
      })
    );

    return batchResult;
  }

  private async emitDelivered(
    userId: string,
    notificationType: NotificationTypeKey,
    providerId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.events.emitAsync(DOMAIN_EVENTS.NOTIFICATION.DELIVERED, {
      userId,
      notificationType,
      channel: "push",
      providerId,
      metadata,
    });
  }

  private async emitFailed(
    userId: string,
    notificationType: NotificationTypeKey,
    error: string,
    errorCode?: NotificationErrorCode,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.events.emitAsync(DOMAIN_EVENTS.NOTIFICATION.FAILED, {
      userId,
      notificationType,
      channel: "push",
      error,
      errorCode,
      metadata,
    });
  }

  private async emitSkipped(
    userId: string,
    notificationType: NotificationTypeKey,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.events.emitAsync(DOMAIN_EVENTS.NOTIFICATION.SKIPPED, {
      userId,
      notificationType,
      channel: "push",
      reason,
      metadata,
    });
  }
}
