# App.js Conf 2026 Talk Working Draft

## Recommendation

### Best title

`The event bus is the best investment I made in my React Native app`

Why this is the strongest option:

- It sounds like a real opinion earned by shipping, not a content-marketing headline.
- It signals architecture, but in a pragmatic way that fits the Treasure It story.
- It creates curiosity: people want to know why an event bus mattered more than a feature.
- It leaves room for the deeper reveal that notifications are only the first consumer.

### Strong backup titles

1. `Notifications are product, not plumbing`
2. `One bus, many consumers: domain events in an Expo app`

How I'd use them:

- Use `Notifications are product, not plumbing` as an opening line or section header inside the talk.
- Use `One bus, many consumers: domain events in an Expo app` as the more technical subtitle in notes, speaker materials, or a blog post.

### Titles I would not lead with

- `Ship Once, Notify Everywhere` is polished, but it sounds more like a messaging-platform talk than a Treasure It architecture talk.
- `Build your own notification system (and when to stop)` is solid, but it centers build-vs-buy too early and undersells the event bus pattern.

## Submission Abstract

Treasure It is an Expo app with push notifications, transactional email, an in-app inbox, chat mirroring, deep links, and scheduled reminders. I built it the obvious way first: `sendPush()`, `sendEmail()`, and `insertInboxEntry()` scattered across routers and services. It worked until it didn't. Every new code path forgot a notification, every new channel meant touching more call sites, and the React Native tap-to-open flow became harder to reason about than the product itself.

The fix was not "a better notification service." It was a typed domain event bus.

In this talk I'll show how I moved Treasure It to an event-driven notification pipeline built with TypeScript, tRPC, Supabase, Trigger.dev, Expo Push, and Expo Router. Services emit rich events describing what happened. Handlers turn those events into push, email, inbox, and chat side effects. The mobile client resolves deep links from the same event payload that powered delivery, so the tap lands on the correct screen without special-case glue.

This is not Kafka, event sourcing, or a giant platform rewrite. It's a practical pattern for React Native teams that want notifications, analytics, webhooks, audit logs, and future integrations to become small handlers instead of new systems. You'll leave with a concrete architecture, a realistic build-vs-buy frame, and a better mental model for where notification logic should live in an Expo app.

## Audience Promise

By the end of the talk, the audience should believe three things:

1. Notifications are the first consumer of a domain event bus, not the reason to avoid one.
2. Rich event payloads are the contract; handlers that need fresh database reads are a smell.
3. In a React Native app, the tap and deep-link path is part of the notification architecture, not an afterthought.

## Positioning

This should land as a production-app talk, not a backend-systems talk.

That means the talk needs to keep returning to:

- Expo Push
- Expo Router deep links
- the in-app inbox
- the chat mirror
- the actual user experience when someone taps a notification

The backend pattern matters, but the audience is App.js. The slide that proves this belongs here is the mobile tap-handling path.

## Code Anchors

These are the real files that should anchor the slides:

- Event and schema contract: `packages/api/src/events/domain-events.ts`
- One-time handler registration in app context: `packages/api/src/trpc.ts`
- Notification fan-out and delivery lifecycle: `packages/api/src/services/notifications/event-handlers.ts`
- Unified notification entrypoint: `packages/api/src/services/notifications/unified-notification.service.ts`
- Inbox ledger and read state: `packages/api/src/services/notifications/notification-ledger.repository.ts`
- Inbox service: `packages/api/src/services/notifications/notification-inbox.service.ts`
- Chat mirroring: `packages/api/src/services/chat/chat-timeline.service.ts`
- Mobile notification tap routing: `packages/app/provider/notifications/NotificationProvider.native.tsx`
- Notification deep-link resolution: `packages/app/services/notificationNavigation.ts`
- Deep-link parsing and Expo Router dispatch: `packages/app/services/deepLinkHandler.ts`
- Inbox UI: `packages/app/features/notifications/inbox-screen.tsx`
- Expo routes for inbox: `apps/expo/app/notifications/inbox.tsx`, `apps/expo/app/(modal)/notifications/inbox.tsx`
- Implementation history / architecture notes: `docs/technical/ADDING_NOTIFICATIONS_GUIDE.md`, `docs/archive/IMPLEMENTATION_ORDER.md`

## Slide Draft

### 1. Title slide

- `The event bus is the best investment I made in my React Native app`
- Benjamin Schachter
- Treasure It
- App.js Conf 2026

### 2. The hook

- Show the full user moment:
- push lands
- user taps
- app opens to the right screen
- system message appears in chat
- inbox state updates

Voiceover:

`This looks like one notification. It's actually four coordinated side effects. It only got simple once I stopped treating notifications like plumbing.`

### 3. Minimum credibility

- Solo founder, sole engineer
- Treasure It is a real Expo app
- ~2100 users
- real consumer workflows, real delivery bugs, real constraints

### 4. Every consumer app hits this

- push
- email
- inbox
- deep links
- preferences
- reminders
- maybe chat mirrors, webhooks, analytics

### 5. The obvious answer

- show the old direct-call shape
- `update DB -> sendPush -> sendEmail -> insertInboxEntry`

Use a real snippet from pre-migration history if you can pull one.

### 6. Why it breaks

- call sites forget things
- new channels multiply touch points
- templates and business logic get tangled
- testing is awkward
- analytics duplicates the same trigger logic

### 7. Reframe

`The notification isn't the thing. The event is.`

### 8. Before / after

Before:

```ts
await db.updateGiftStatus(giftId, 'picked_up')
await sendPush(giverId, '...')
await sendEmail(giverId, '...')
await insertInboxEntry(giverId, '...')
```

After:

```ts
await db.updateGiftStatus(giftId, 'picked_up')
await eventBus.emit(EVENTS.PICKUP_STATUS.RECEIVER_COMPLETED, payload)
```

### 9. The shape of the system

- domain services emit
- one bus fans out
- notifications are one subscriber
- analytics, webhooks, audit, CRM are future subscribers

This is the "one bus, many consumers" diagram slide.

### 10. Pattern piece 1: rich payloads

Anchor in `packages/api/src/events/domain-events.ts`.

Message:

`The payload is the contract.`

What to show:

- a real event schema, ideally `recipients.selection_completed` or one of the pickup-status flows
- enough fields to prove the point: user ids, names, counts, timestamps, gift metadata

What to say:

`If the handler needs to hit the database to figure out what happened, the event is too thin.`

### 11. Pattern piece 2: one send API, many channels

Anchor in `packages/api/src/services/notifications/unified-notification.service.ts`.

Show:

- `notificationService.send(userId, type, { push, email, ... })`
- preference-gated channels
- ledger write

Important product point:

- push and email are preference-gated
- inbox persists as the record
- chat mirroring is not "just another push"; it's part of the conversation surface

### 12. Pattern piece 3: the React Native slide

This is the most important slide for App.js.

Anchors:

- `packages/app/provider/notifications/NotificationProvider.native.tsx`
- `packages/app/services/notificationNavigation.ts`
- `packages/app/services/deepLinkHandler.ts`

Show:

- the push response listener
- `dispatchNotificationNavigation(notificationData)`
- resolution of explicit and legacy deep links
- final Expo Router navigation

The point:

`A notification is not done when it is delivered. It is done when the tap lands correctly.`

### 13. Demo

Ideal flow:

1. trigger a real event
2. push lands on device
3. tap
4. open correct screen
5. show mirrored system message
6. show inbox badge/read state

Use Android. Record a backup video.

### 14. The compounding win

Show the fan-out promise explicitly:

```ts
eventBus.on('pickup.completed', sendNotifications)
eventBus.on('pickup.completed', trackInPostHog)
eventBus.on('pickup.completed', notifyPartnerWebhook)
eventBus.on('pickup.completed', appendAuditLog)
eventBus.on('pickup.completed', updateCRM)
```

Core line:

`Notifications were the first expensive side effect. Once the bus existed, every future side effect got cheap.`

### 15. Honest boundaries

Build this when:

- small team or solo
- notifications are part of product UX
- you want types end-to-end
- you want to own the domain contract

Buy when:

- non-engineers need template editing
- you need provider failover / compliance tooling
- the coordination problem is larger than the implementation problem

Important caveat:

`This is not event sourcing. It's a typed in-process event bus.`

### 16. Takeaways

1. Emit events, not side effects.
2. Put everything in the payload.
3. One bus makes every future consumer cheaper.

### 17. Final line

`The event bus was the cheapest architectural decision with the biggest downstream payoff.`

### 18. Close

- site
- GitHub
- LinkedIn
- QR code if you publish slides / repo / blog post

## Concrete Snippets To Pull Next

These are the first snippets worth replacing placeholders with:

1. `packages/api/src/trpc.ts`
   Show one-time handler registration and frame it as "wiring the subscribers at app startup."

2. `packages/api/src/services/notifications/unified-notification.service.ts`
   Pull the `send()` signature and one preference-gated branch.

3. `packages/api/src/services/notifications/event-handlers.ts`
   Pull one handler that calls `notificationService.send(...)` and, if possible, one chat-mirror path.

4. `packages/app/provider/notifications/NotificationProvider.native.tsx`
   Pull the `Notifications.addNotificationResponseReceivedListener(...)` block.

5. `packages/app/services/notificationNavigation.ts`
   Pull `resolveNotificationDeepLink(...)` or `dispatchNotificationNavigation(...)`.

6. `packages/app/services/deepLinkHandler.ts`
   Pull one small Expo Router dispatch block to prove the mobile destination is typed and centralized.

## Speaker Guidance

The tone should be:

- architecture-ambitious
- production-pragmatic
- warm, not smug
- very explicit that this came from shipping alone, not from inventing a grand system in advance

Avoid:

- framing this like "I built my own Knock, therefore everyone should"
- spending too long on notification channels without making the broader event-bus case
- turning the middle of the talk into a backend lecture without returning to the mobile tap experience

## Next Iteration Tasks

1. Replace placeholder code with real snippets.
2. Decide whether the demo is live or pre-recorded with live narration.
3. Tighten the final abstract to the exact CFP word limit if needed.
4. Decide whether to ship a same-week blog post and QR code.
5. Implement one non-notification subscriber before the conference if possible.

The best candidate is PostHog tracking for `pickup.completed`, because it makes slide 14 feel real rather than aspirational.
