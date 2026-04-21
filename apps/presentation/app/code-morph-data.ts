import { cache } from "react";
import { createHighlighter } from "shiki";
import { codeToKeyedTokens, createMagicMoveMachine, type KeyedTokensInfo } from "shiki-magic-move/core";

const codeSteps = [
  `await db.updateGiftStatus(giftId, "picked_up");
await sendPush(giverId, {
  title: "Pickup completed",
  deepLink: "/gifts/" + giftId,
});
await sendEmail(giverId, pickupCompletedEmail);
await insertInboxEntry(giverId, {
  type: "pickup_completed",
});`,
  `await db.updateGiftStatus(giftId, "picked_up");
await sendPush(giverId, {
  title: "Pickup completed",
  deepLink: "/gifts/" + giftId,
});
await sendEmail(giverId, pickupCompletedEmail);
await insertInboxEntry(giverId, {
  type: "pickup_completed",
});
await chatTimeline.addSystemMessage(conversationId, {
  body: "Pickup completed",
});`,
  `await db.updateGiftStatus(giftId, "picked_up");
await eventBus.emit("pickup.completed", {
  giftId,
  giverId,
  receiverId,
  giftName,
  completedAt: new Date().toISOString(),
  navigationTarget: "/gifts/" + giftId,
});`,
];

export const getCodeMorphSteps = cache(async (): Promise<KeyedTokensInfo[]> => {
  const highlighter = await createHighlighter({
    themes: ["github-dark"],
    langs: ["ts"],
  });

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

  return codeSteps.map((code) => machine.commit(code).current);
});
