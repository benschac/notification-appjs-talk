import { cache } from "react";
import { createHighlighter } from "shiki";
import { codeToKeyedTokens, createMagicMoveMachine, type KeyedTokensInfo } from "shiki-magic-move/core";

const directSideEffectSteps = [
  `await markInterestShown(itemId);`,
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});`,
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});
await sendEmail(gifterId, interestEmail);`,
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});
await sendEmail(gifterId, interestEmail);
await insertInboxEntry(gifterId, {
  type: "item_interest_first_shown",
});`,
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});
await sendEmail(gifterId, interestEmail);
await insertInboxEntry(gifterId, {
  type: "item_interest_first_shown",
});
await mirrorInterestToChat(conversationId, {
  itemId,
  userName,
});`,
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});
await sendEmail(gifterId, interestEmail);
await insertInboxEntry(gifterId, {
  type: "item_interest_first_shown",
});
await mirrorInterestToChat(conversationId, {
  itemId,
  userName,
});
await sendWebhook("item.interest_shown", {
  itemId,
  gifterId,
});`,
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});
await sendEmail(gifterId, interestEmail);
await insertInboxEntry(gifterId, {
  type: "item_interest_first_shown",
});
await mirrorInterestToChat(conversationId, {
  itemId,
  userName,
});
await sendWebhook("item.interest_shown", {
  itemId,
  gifterId,
});
await publishLiveEvent("item.interest_shown", {
  itemId,
  gifterId,
});`,
];

const codeSteps = [
  directSideEffectSteps[6],
  `await markInterestShown(itemId);
await sendPush(gifterId, {
  title: userName + " is interested",
  deepLink: "/items/" + itemId,
});
await sendEmail(gifterId, interestEmail);
await insertInboxEntry(gifterId, {
  type: "item_interest_first_shown",
});
await mirrorInterestToChat(conversationId, {
  itemId,
  userName,
});
await sendWebhook("item.interest_shown", {
  itemId,
  gifterId,
});
await publishLiveEvent("item.interest_shown", {
  itemId,
  gifterId,
});`,
  `await markInterestShown(itemId);
await eventBus.emit(EVENTS.ITEM_INTEREST.FIRST_SHOWN, {
  userId,
  userName: interestedUser.name || "there",
  gifterId,
  giftId,
  giftTitle,
  itemId,
  itemTitle,
  shownAt: eventTimestamp,
});`,
];

type TalkCodeSteps = {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
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
  };
});
