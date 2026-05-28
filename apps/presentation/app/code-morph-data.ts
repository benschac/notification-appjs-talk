import { cache } from "react";
import { createHighlighter } from "shiki";
import {
  codeToKeyedTokens,
  createMagicMoveMachine,
  type KeyedTokensInfo,
} from "shiki-magic-move/core";

const directSideEffectSteps = [
  `await bidOnItem(itemId, amount);`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);
await insertInboxEntry(sellerId, {
  type: "item_bid_received",
});`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);
await insertInboxEntry(sellerId, {
  type: "item_bid_received",
});
await mirrorBidToChat(conversationId, {
  itemId,
  bidderName,
  amount,
});`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);
await insertInboxEntry(sellerId, {
  type: "item_bid_received",
});
await mirrorBidToChat(conversationId, {
  itemId,
  bidderName,
  amount,
});
posthog.capture("item_bid_received", {
  distinctId: sellerId,
  itemId,
  amount,
});`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);
await insertInboxEntry(sellerId, {
  type: "item_bid_received",
});
await mirrorBidToChat(conversationId, {
  itemId,
  bidderName,
  amount,
});
posthog.capture("item_bid_received", {
  distinctId: sellerId,
  itemId,
  amount,
});
await sendSlackWebhook("#sales", {
  text: bidderName + " bid on " + itemTitle,
});`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);
await insertInboxEntry(sellerId, {
  type: "item_bid_received",
});
await mirrorBidToChat(conversationId, {
  itemId,
  bidderName,
  amount,
});
posthog.capture("item_bid_received", {
  distinctId: sellerId,
  itemId,
  amount,
});
await sendSlackWebhook("#sales", {
  text: bidderName + " bid on " + itemTitle,
});
await sendWebhook("item.bid_received", {
  itemId,
  sellerId,
  amount,
});`,
  `await bidOnItem(itemId, amount);
await sendPush(sellerId, {
  title: bidderName + " bid on your item",
  deepLink: "/items/" + itemId,
});
await sendEmail(sellerId, bidEmail);
await insertInboxEntry(sellerId, {
  type: "item_bid_received",
});
await mirrorBidToChat(conversationId, {
  itemId,
  bidderName,
  amount,
});
posthog.capture("item_bid_received", {
  distinctId: sellerId,
  itemId,
  amount,
});
await sendSlackWebhook("#sales", {
  text: bidderName + " bid on " + itemTitle,
});
await sendWebhook("item.bid_received", {
  itemId,
  sellerId,
  amount,
});
await publishLiveEvent("item.bid_received", {
  itemId,
  sellerId,
  amount,
});`,
];

const codeSteps = [
  directSideEffectSteps[6],
  directSideEffectSteps[8],
  `await bidOnItem(itemId, amount);

useEffect(() => {
  void importantSideEffects();
}, [itemId]);

async function importantSideEffects() {
  // push, email, inbox, chat, analytics, Slack,
  // webhooks, and live updates moved over here
}`,
  `await bidOnItem(itemId, amount);
await eventBus.dispatch({
  type: DOMAIN_EVENTS.ITEM.BID_RECEIVED,
  payload: {
    bidderId,
    bidderName: bidder.name || "someone",
    sellerId,
    giftId,
    giftTitle,
    itemId,
    itemTitle,
    amount,
    bidAt: eventTimestamp,
  },
});`,
];

const eventEmitStep = `await bidOnItem(itemId, amount);

eventBus.dispatch({
  type: DOMAIN_EVENTS.ITEM.BID_RECEIVED,
  payload: {
    sellerId,
    bidderId,
    itemId,
    amount,
    bidAt,
  },
});`;

const notificationServiceSteps = [
  `const unifiedNotifications = createNotificationService({});`,
  `const unifiedNotifications = createNotificationService({
  push: pushService,
});`,
  `const unifiedNotifications = createNotificationService({
  push: pushService,
  email: emailService,
});`,
  `const unifiedNotifications = createNotificationService({
  push: pushService,
  email: emailService,
  userPreferences: userPreferencesSingleton,
});`,
  `const unifiedNotifications = createNotificationService({
  push: pushService,
  email: emailService,
  userPreferences: userPreferencesSingleton,
  ledger: notificationLedgerRepository,
});`,
  `const unifiedNotifications = createNotificationService({
  push: pushService,
  email: emailService,
  userPreferences: userPreferencesSingleton,
  ledger: notificationLedgerRepository,
  defaults: { batch: { useEmailQueue: true } },
});`,
];

const preferenceGateSteps = [
  `createEventHandler(
  DOMAIN_EVENTS.ITEM.BID_RECEIVED,
  async (payload) => {
    await sendNotificationFromTemplate(
      DOMAIN_EVENTS.ITEM.BID_RECEIVED,
      payload,
      payload.sellerId,
      notificationService
    );
  }
);`,
  `async function sendNotificationFromTemplate(
  eventName,
  payload,
  recipientId,
  notificationService,
  options = {}
) {
  const notificationType = domainEventSchemas[eventName].notification;
  const template = getNotificationTemplate(eventName);

  const push = template.push && {
    title: template.push.title(payload),
    body: template.push.body(payload),
    data: template.push.data?.(payload),
  };

  const email = template.email && {
    subject: template.email.subject(payload),
    html: await template.email.html(payload),
  };

  return notificationService.send(
    recipientId,
    notificationType,
    { push, email },
    options.ledgerMetadata,
    { groupId: options.groupId }
  );
}`,
  `const preferences =
  parseNotificationPreferences(profile.notification_preferences) ??
  getDefaultNotificationPreferences();

return {
  email:
    preferences.email.enabled &&
    (preferences.email.types[notificationType] ?? true),
  push:
    preferences.push.enabled &&
    (preferences.push.types[notificationType] ?? true),
};`,
  `async send(userId, notificationType, payload, groupId) {
  const prefs = await this.userPreferences.getNotificationPreferences(
    userId,
    notificationType,
    groupId
  );

  if (!prefs.push) {
    return skip("Push notifications disabled for this type");
  }

  return this.push.sendToUser({ userId, payload });
}`,
];

const eventBusTeachingSteps = [
  `export const DOMAIN_EVENTS = Object.freeze({
  ITEM: {
    BID_RECEIVED: "item.bid_received",
  },
} as const);`,
  `export const domainEventSchemas = {
  [DOMAIN_EVENTS.ITEM.BID_RECEIVED]: {
    notification: DOMAIN_EVENTS.ITEM.BID_RECEIVED,
    payload: giftUpdatedSchema,
    template: updatePushDataSchema,
  },
} as const;`,
  `export const domainEventSchemas = {
  [DOMAIN_EVENTS.ITEM.BID_RECEIVED]: {
    notification: DOMAIN_EVENTS.ITEM.BID_RECEIVED,
    payload: giftUpdatedSchema,
    template: updatePushDataSchema,
  },
} as const;

export type DomainEvents = {
  [K in keyof typeof domainEventSchemas]:
    z.infer<(typeof domainEventSchemas)[K]["payload"]>;
};`,
  `class TypedEventBus {
  emit<K extends keyof typeof domainEventSchemas>(
    event: K,
    payload: DomainEvents[K]
  ) {
    const schema = domainEventSchemas[event].payload;
    const validatedPayload = schema.parse(payload);

    return this.emitter.emit(event, validatedPayload);
  }
}`,
  `const payload = z.object({
  threadId: z.string(),
  offerEventId: z.string(),
  acceptingProfileId: z.string(),
  buyerProfileId: z.string(),
  sellerProfileId: z.string(),
  buyerReserveLedgerId: z.string(),
  sellerReserveLedgerId: z.string(),
  buyerConsumeLedgerId: z.string().nullable(),
  sellerConsumeLedgerId: z.string().nullable(),
  activatedAt: z.date(),
});`,
];

const sendPushPreferenceStep = `async sendPush(
  userId: string,
  notificationType: NotificationTypeKey,
  payload: Parameters<PushNotificationService['sendToUser']>[0]['payload'],
): Promise<ChannelResult> {
  const prefs = await this.userPreferences.getNotificationPreferences(
    userId,
    notificationType,
    groupId
  )
}`;

type TalkCodeSteps = {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
  eventBusTeachingStep: KeyedTokensInfo[];
  eventEmitStep: KeyedTokensInfo[];
  notificationServiceSteps: KeyedTokensInfo[];
  preferenceGateSteps: KeyedTokensInfo[];
  sendPushPreferenceStep: KeyedTokensInfo[];
};

function compileCodeSteps(
  highlighter: Awaited<ReturnType<typeof createHighlighter>>,
  steps: string[],
) {
  const machine = createMagicMoveMachine((code) =>
    codeToKeyedTokens(
      highlighter,
      code,
      {
        lang: "ts",
        theme: "github-dark",
      },
      true,
    ),
  );

  return steps.map((code) => machine.commit(code).current);
}

export const getTalkCodeSteps = cache(async (): Promise<TalkCodeSteps> => {
  const highlighter = await createHighlighter({
    themes: ["github-dark"],
    langs: ["ts"],
  });

  return {
    codeMorphSteps: compileCodeSteps(highlighter, codeSteps),
    directSideEffectSteps: compileCodeSteps(highlighter, directSideEffectSteps),
    eventBusTeachingStep: compileCodeSteps(highlighter, eventBusTeachingSteps),
    eventEmitStep: compileCodeSteps(highlighter, [eventEmitStep]),
    notificationServiceSteps: compileCodeSteps(
      highlighter,
      notificationServiceSteps,
    ),
    preferenceGateSteps: compileCodeSteps(highlighter, preferenceGateSteps),
    sendPushPreferenceStep: compileCodeSteps(highlighter, [
      sendPushPreferenceStep,
    ]),
  };
});
