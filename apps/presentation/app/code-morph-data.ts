import { cache } from "react";
import { createHighlighter } from "shiki";
import { codeToKeyedTokens, createMagicMoveMachine, type KeyedTokensInfo } from "shiki-magic-move/core";

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
await eventBus.emit(EVENTS.ITEM.BID_RECEIVED, {
  bidderId,
  bidderName: bidder.name || "someone",
  sellerId,
  giftId,
  giftTitle,
  itemId,
  itemTitle,
  amount,
  bidAt: eventTimestamp,
});`,
];

const eventEmitStep = `await bidOnItem(itemId, amount);

eventBus.emit(EVENTS.ITEM_BID_RECEIVED, {
  sellerId,
  bidderId,
  itemId,
  amount,
  bidAt,
});`;

type TalkCodeSteps = {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
  eventEmitStep: KeyedTokensInfo[];
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
    eventEmitStep: compileCodeSteps(highlighter, [eventEmitStep]),
  };
});
