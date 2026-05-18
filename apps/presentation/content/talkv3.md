# App.js Conf 2026 — 20-Minute Talk Plan (v3)

**Title:** `Ship Once, Notify Everywhere`

**Recurring subtitle / spoken refrain:** `The event bus was the best investment I made in my React Native app.`

## Status

This plan is ready for deck/script execution after one decision gate:

**Choose exactly one hero flow.**

Recommended options:

1. `recipient.selected`
   - Best React Native payoff.
   - Shows event -> notification -> tap -> pickup confirmation / chat context.
   - Best for explaining payload-driven navigation, chat mirroring, and safe route fallback.

2. `pickup.receiver_completed`
   - Strongest emotional product moment.
   - Better if the talk should feel like a real-world pickup story first.
   - Slightly weaker for showing the full routing contract.

Decision criteria:

- The flow must show event emission, unified notification handling, runtime preference/config relevance, push arrival, tap navigation, and fallback behavior.
- The hero-flow setup must be narratable in under 90 seconds.
- The flow must make the Expo / React Native tap path feel like architecture, not a frontend epilogue.

Until this is chosen, slide examples should use `[hero event]`, `[recipient]`, and `[destination]` placeholders.

## Core Promise

This is a production React Native story about notifications, but the deeper lesson is that notifications are not the center of the system. The product event is the center. Notifications are one subscriber.

The audience should leave with this model:

`Product event -> typed payload -> notification fan-out -> mobile tap -> correct screen`

The backend architecture matters because it protects the mobile product moment. A notification is not done when the provider accepts it. It is done when the user taps it and lands in the right place.

Secondary payoff: once product truth flows through typed events, internal product surfaces can subscribe too. Chat mirroring is the clearest example: the same event that drives a notification can also add a system message to the chat timeline, without putting chat-specific writes back into the product service.

## Stage-Safe Scale Claim

Use this wording in public slides:

> Treasure It has 80+ named notification constants in code; the runtime preference schema covers the persisted preference keys; curated display config controls which variants users can configure.

Do **not** say `55+ notification types` or `69 DB types` on a public slide unless that count is freshly recomputed and carefully explained. The exact internal count is easy to misread because code constants include future/planned entries, runtime preference entries are schema-driven, and display configuration is a curated subset.

## What Changed From v2

This revision applies the ralplan decisions:

- Converts the outline from a generic notification-system talk into a product-flow-first App.js talk.
- Keeps the title locked, but promotes the event-bus line as a recurring refrain.
- Replaces the brittle `55+` scale claim with stage-safe scale wording.
- Makes the hero flow an explicit decision gate instead of silently choosing one.
- Makes the Expo / React Native tap path a hard center section by minute 14.
- Keeps the demo capture speaker-owned, with a checklist and pass/fail criteria rather than agent-owned production work.
- Clarifies that the event bus is an in-process application boundary, not Kafka, event sourcing, durable messaging, or a guaranteed async queue.

## Timing Model

Target length: 20 minutes.

- **0:00-2:00** — Problem and promise: notifications are a product surface.
- **2:00-4:00** — Hero flow walkthrough.
- **4:00-7:00** — Domain event and notification taxonomy.
- **7:00-10:00** — Unified notification service.
- **10:00-14:00** — Expo / React Native tap path.
- **14:00-17:00** — Recorded walkthrough.
- **17:00-19:00** — Build-vs-buy and tradeoffs.
- **19:00-20:00** — Closing checklist.

Hard gate: the RN / Expo tap path must appear by minute 14.

Deck size:

- 13 primary slides.
- 3 major animated teaching slides: direct-call growth, one-event/many-surfaces, tap path.
- Backup slides after the close for implementation anchors and provider mechanics.

## Audience Throughline

The talk should keep returning to one user-visible sequence:

- a product event happens
- the event carries enough truth
- a notification is sent across the right channels
- internal product surfaces can mirror the event when useful
- the user taps it
- the app opens to the right place
- inbox, chat, reminder, and delivery state stay consistent

The App.js-specific argument is that tap routing is part of the architecture. Push payloads, deep links, and Expo Router destinations are not afterthoughts; they are the mobile side of the domain contract.

## Critical Guardrails

- The hero flow can make or break the talk. Choose the flow that best proves the architecture, not just the most emotional story. Current bias: `recipient.selected`, because it best demonstrates mobile routing, context, chat/inbox consistency, and safe fallback.
- Do not let the talk sound like "events solve everything." The honest claim is architectural leverage from a typed in-process boundary, not magical reliability.
- Make the React Native section concrete quickly: notification response listener, payload resolution order, deep-link dispatch, and Expo Router destination. Avoid hand-wavy phrasing like "and then the app opens."
- Treat the `80+` scale line as credibility color, not the point. Spend seconds on it, then return to how one more notification no longer spreads across product flows.
- Show at least one failure mode from the old world: wrong screen, missing inbox entry, skipped chat mirror, provider success with broken product outcome, or tests that need to know too much.
- Do not replace one coupling example with another. The before/after transition should go from direct product-flow side effects to a provider-free domain event first; only after that should the handler/template layer introduce channel payloads.
- Treat `unified-notification.service.ts` as implementation proof, not the main character. It is the delivery boundary that makes the architecture credible; the story is still product event -> typed payload -> handler/template -> mobile tap path.
- Decoupling does not mean the notification service disappears. It means product services stop calling delivery services directly; notification delivery moves behind typed event handlers and templates.
- Make type safety a main teaching point, not backup trivia: TypeScript catches wrong event payloads while Zod catches invalid runtime emissions.
- Edit the demo brutally. It should prove three things: the event fired, notification fan-out happened, and the tap landed correctly. Everything else is optional.
- Keep build-vs-buy generous. The best line is: vendors are useful once your domain event is clear.
- End with a reusable checklist, not only a slogan.

## Narrative Spine

### 1. The Moment

Open with one concrete user moment from the chosen hero flow.

Example placeholder:

`[Hero event] happens. The other user sees a notification, taps it, and lands directly in [destination].`

Core line:

`This looks like one notification. It is actually several coordinated product side effects.`

What the moment includes: push delivery, transactional email, in-app inbox state, chat timeline mirror when relevant, deep-link payload, Expo Router navigation, preference and eligibility rules, and delivery lifecycle state.

### 2. The Reasonable First Version

The first version looks reasonable:

```ts
await updateProductState(...);
await sendPush(userId, pushPayload);
await sendEmail(userId, emailPayload);
await insertInboxEntry(userId, inboxPayload);
```

It is not obviously bad. It is the kind of code a small team ships because it works.

### 3. The Breakage Pattern

The problem is not that notifications are hard once. The problem is that every product flow repeats the same coordination problem.

Failures to name:

- one call site forgets a channel
- one channel gets the wrong deep link
- one template needs data the service did not load
- one reminder path skips inbox state
- one chat mirror gets added later and now every call site is suspect
- tests have to know too much about unrelated side effects

The audience should recognize this as product complexity, not infrastructure complexity.

Pick one concrete failure to dramatize before the reframe. Best candidates:

- provider accepted the push, but the tap opened the wrong screen
- inbox state existed, but chat context did not match
- a reminder path sent push/email but skipped the ledger
- tests for a product flow had to mock unrelated notification side effects

### 4. The Reframe

The notification is not the thing. The event is the thing.

Instead of asking:

`Where do I send this notification?`

Ask:

`What happened in the product, and who needs to react to it?`

That turns scattered side-effect calls into one product event:

```ts
eventBus.emit(DOMAIN_EVENTS.[HERO_EVENT], payload);
```

### 5. The Architecture Boundary

Domain services emit rich typed events. Handlers subscribe and own side effects.

Core pieces:

- typed domain event contract
- rich event payloads
- in-process event bus
- notification event handlers
- unified notification service
- channel-specific delivery services
- notification ledger / inbox state
- mobile tap and deep-link resolver

Boundary caveat:

This is an EventEmitter-backed, process-local, runtime-validated application boundary. It is not Kafka, not event sourcing, not durable messaging, and not a guaranteed async queue.

Decoupling caveat:

`The notification service still exists. The change is who is allowed to know about it. Product services emit domain events; notification handlers and templates know about notification delivery.`

### 6. The Bigger Payoff

Notifications are the first expensive subscriber. Once the event exists, future subscribers become small:

```ts
eventBus.on('[hero.event]', sendNotifications);
eventBus.on('[hero.event]', mirrorIntoChatTimeline);
eventBus.on('[hero.event]', trackAnalytics);
eventBus.on('[hero.event]', appendAuditLog);
```

Use current proof where possible: chat mirroring is the strongest internal-product subscriber because it turns the same domain event into durable chat context. Analytics is also a realistic subscriber pattern. Keep webhook/CRM examples framed as extensions, not claims about current product behavior.

Core line:

`The event bus is small. The leverage comes from where it sits.`

## Slide Outline

### Slide 1 — Title

Time: 30 sec. Visual: title, Treasure It, App.js Conf 2026.

Speaker goal: frame this as a production React Native story.

### Slide 2 — The User Moment

Time: 1.5 min. Visual: hero product event -> notification -> tap -> destination screen.

Speaker goal: make the notification feel like part of a product workflow, not a delivery mechanism.

Core line:

`A notification is not done when it is delivered. It is done when the tap lands correctly.`

### Slide 3 — What Was Actually Happening

Time: 1 min. Visual: one visible notification on the left, hidden side effects on the right.

Hidden side effects: push, email, inbox, chat system message if relevant, deep link, preference checks, eligibility rules, delivery lifecycle.

Speaker goal: make the complexity visible before showing code.

### Slide 4 — The Reasonable First Version

Time: 1.5 min. Visual: direct-call code snippet.

```ts
await updateProductState(...);
await sendPush(...);
await sendEmail(...);
await insertInboxEntry(...);
```

Speaker goal: do not dunk on the first version. It worked until the product had more surfaces.

### Slide 5 — Code Morph: Direct Calls Grow *(animated)*

Time: 2 min.

Animation beats:

1. database mutation
2. add push
3. add email
4. add inbox
5. add chat mirror / reminder / lifecycle state
6. collapse into one domain event

Core line:

`Every new surface meant touching the business flow again.`

### Slide 6 — Reframe

Time: 45 sec. Visual: large text.

`The notification is not the thing. The event is the thing.`

Speaker goal: give the talk its mental model and introduce the refrain:

`The event bus turned out to be the best investment I made in this React Native app.`

### Slide 7 — Product Events Need Enough Truth

Time: 1.5 min. Visual: typed payload card.

Example fields:

- actor/user IDs
- product object IDs
- display copy inputs
- occurredAt
- group/conversation context when relevant

Speaker goal: explain that handlers should not rediscover product meaning from scratch.

Contrast:

```ts
// Too thin: handler has to rediscover product meaning
recipient.selected: z.object({
  giftId: z.string(),
  recipientId: z.string(),
});

// Better: event carries the truth the handler needs
recipient.selected: z.object({
  giftId: z.string(),
  giftName: z.string(),
  giverId: z.string(),
  gifterName: z.string(),
  recipientId: z.string(),
  chosenItemsCount: z.number(),
  interestedItemsCount: z.number(),
  selectedAt: z.date(),
});
```

Teaching example:

```ts
this.ctx.eventBus.emit(EVENTS.ITEM_INTEREST.FIRST_SHOWN, {
  userId,
  userName: interestedUser.name || 'there',
  gifterId,
  giftId: item.gift_id || undefined,
  giftTitle: item.gift?.name || undefined,
  itemId,
  itemTitle: item.title || undefined,
  shownAt: eventTimestamp,
});
```

Speaker point:

`There is no push provider here. No email provider. No inbox write. No deep link. This service says what happened in the product and stops there.`

Type-safety point:

`The event name chooses the payload type at compile time, and the event bus validates the same payload with Zod at runtime. This is not just a naming convention.`

Tightened line:

`The payload should carry product meaning. Infrastructure lookups are fine; reconstructing what happened is the smell.`

### Slide 8 — Animated Data Flow: One Event, Many Surfaces *(centerpiece)*

Time: 3 min. Layout: product action -> provider-free domain event -> Zod-validated event bus -> typed handler -> template/channel policy -> unified notification service -> surfaces -> mobile tap path.

Animation beats:

1. Product action: first interest shown, pickup completed, or chosen hero event.
2. Product service emits one provider-free domain event.
3. Event bus validates the payload with the event's Zod schema.
4. Domain event registry maps event -> notification type and payload contract.
5. Handler/template chooses recipient, copy, channels, destination metadata, and optional internal mirrors.
6. Unified service checks preferences and sends or persists each channel.
7. Fan-out: push, email, inbox ledger, chat mirror when applicable.
8. Subscriber extension: analytics / audit.
9. Mobile tap path: response listener -> deep-link resolver -> Expo Router.

Speaker goal: show the full system without making it feel like a platform rewrite.

### Slide 9 — Delivery Boundary

Time: 1.5 min. Visual: handler/template boundary plus simplified service result envelope.

```ts
createEventHandler(DOMAIN_EVENTS.ITEM_INTEREST.FIRST_SHOWN, async (payload) => {
  await sendNotificationFromTemplate(
    DOMAIN_EVENTS.ITEM_INTEREST.FIRST_SHOWN,
    payload,
    payload.userId,
    notificationService
  );
});
```

Speaker goal: the product flow emits product truth; the handler/template boundary turns that truth into notification intent; the unified service proves the boundary by owning delivery policy and results.

Positioning:

`This service is important, but it is not the main character. The main character is the event boundary. The unified service is where delivery mechanics go so product services do not need to know them.`

Points:

- product services never mention providers
- Zod schemas protect event payloads at runtime
- TypeScript protects event names and payload shapes at compile time
- rich event schemas prevent handlers from querying the database to reconstruct product context
- templates decide channel copy and destination metadata
- typed event payloads also make internal product subscribers possible, such as chat timeline system messages
- unified service is the delivery boundary, not the product boundary
- preference checks
- channel fan-out
- batch behavior
- email queue fallback
- delivery result aggregation
- ledger writes
- channel services stay replaceable

Timing note: spend 60-90 seconds here. Do not turn this into a file tour.

Note: do not imply every notification path is only `send()`, and do not present `{ push, email, inbox, deepLink }` as the product-service replacement. That object belongs at the notification boundary after the domain event is already clean.

### Slide 10 — The React Native Tap Path *(animated pillar slide)*

Time: 4 min. Visual: notification payload -> native response listener -> payload resolver -> deep-link dispatch -> Expo Router destination.

Animation beats:

1. notification arrives
2. user taps
3. native response listener receives payload
4. unread/inbox state syncs
5. payload resolves in order:
   - explicit `deepLink`
   - `screen`
   - legacy notification-type fallback
   - notifications inbox fallback
6. deep-link dispatch hands off to app routing
7. Expo Router lands on the intended product surface

Speaker goal: make this the App.js payoff. The payload connects server truth to mobile navigation.

Avoid vague shorthand. Name the actual mobile contract:

`response listener -> payload resolver -> explicit deepLink/screen/legacy fallback -> deep-link dispatch -> Expo Router destination`

Core line:

`Delivery is a backend concern. Landing in the right screen is a product concern. The payload connects them.`

### Slide 11 — Recorded Walkthrough

Time: 3 min. Format: pre-recorded split-screen capture, narrated live.

Default: fully recorded. Optional live trigger only after successful rehearsal.

Left half:

- event emitted
- handler fired
- unified notification service result
- push / email / inbox / chat or ledger result
- chat mirror if the chosen hero flow includes it

Right half:

- device or simulator
- notification arrives
- user taps
- destination screen opens
- inbox/chat state is consistent

Speaker-owned prep outline:

- Pick the final hero flow and write a one-sentence setup.
- Prepare app/device state: signed-in accounts, notification permissions, clean inbox/chat state, destination screen ready to verify.
- Prepare backend/log view: event name, handler/service path, channel result, and ledger/inbox write, with no secrets or noisy unrelated logs.
- Record one clean main path: product event -> notification/log result -> push arrival -> tap -> correct destination.
- Record or screenshot one safe fallback: incomplete or missing route metadata -> notifications inbox or another deliberate fallback.
- Trim the capture to under 3 minutes and keep only the moments that prove the architecture claim.

Brutal edit rule:

The walkthrough only needs to prove three things: the event fired, fan-out happened, and the tap landed correctly. Cut anything that does not prove one of those.

Pass/fail criteria:

- product event is visible
- handler/service path is visible or clearly narrated
- runtime preference/config distinction is clear
- channel or ledger result is visible or narrated
- chat mirror is visible or explicitly out of scope for the chosen hero flow
- push arrives
- tap opens the intended route
- fallback routes safely
- full sequence is under 3 minutes

Backup if the recording fails: log output alone showing event -> handler -> service -> ledger/inbox result.

### Slide 12 — Build vs Buy

Time: 2 min. Tone: not defensive. The answer is not "never use a vendor." It is "know which problem you are solving."

Third-party notification services are strong at:

- campaign orchestration
- non-engineer template editing
- segmentation
- cross-channel messaging operations
- analytics dashboards
- provider failover and compliance
- marketing lifecycle messaging

They are weak as the only place to encode product truth:

- they do not know your domain model unless you model it for them
- they still need rich events
- they still need correct deep links
- they still need product-specific eligibility rules
- they should not own app navigation logic

Best combined model:

Your app emits typed domain events and owns eligibility plus deep links. A vendor can be one subscriber. The vendor owns message operations; the product owns what happened and where the user should land.

Core line:

`A third-party service can deliver messages. It cannot decide what happened in your product unless your product tells it clearly.`

### Slide 13 — Takeaways

Time: 1 min.

1. Emit events, not scattered side effects.
2. Put enough product truth in the payload.
3. Treat notification taps as part of the architecture.
4. Persist enough metadata to debug and recover.
5. Buy delivery tooling when operations become the hard part, not before the domain contract exists.

Reusable checklist:

- What happened?
- Who needs to know?
- Which channels should fire?
- What should the tap do?
- What fallback is safe?
- What gets logged?

Closing line:

`The event bus was not a notification system. It was the boundary that made every notification — and every future side effect — cheaper.`

## Backup Slides

### Backup A — Code Anchors

For anyone who wants the concrete implementation map:

- `packages/api/src/events/domain-events.ts`
- `packages/api/src/events/simple-event-bus.ts`
- `packages/api/src/services/receiving/interest-management.service.ts`
- `packages/api/src/trpc.ts`
- `packages/api/src/services/notifications/event-handlers.ts`
- `packages/api/src/services/notifications/unified-notification.service.ts`
- `packages/api/src/services/notifications/notification-templates.ts`
- `packages/api/src/services/chat/chat-timeline.service.ts`
- `packages/app/provider/notifications/NotificationProvider.native.tsx`
- `packages/app/services/notificationNavigation.ts`
- `packages/app/services/deepLinkHandler.ts`
- `packages/app/features/chat/state/chat-timeline.ts`

### Backup B — What This Is Not

This is not:

- Kafka
- event sourcing
- durable messaging
- a distributed workflow engine
- a replacement for all notification vendors
- a generic messaging platform

This is:

- a typed in-process application event boundary
- a way to keep product flows clean
- a way to make notification side effects explicit and testable
- a way to connect server-side product truth to Expo Router navigation

### Backup C — Type-Safety Proof Points

Use these if someone asks whether this is only a naming convention:

- `DomainEvents[K]` gives each event name a compile-time payload shape.
- `domainEventSchemas[event].payload.parse(payload)` validates emitted events at runtime.
- `domainEventSchemas` maps event names to notification types and payload schemas.
- `notification-templates.ts` turns validated domain payloads into channel-specific copy and metadata.
- `event-handlers.ts` is the subscription layer between product events and notification delivery.

### Backup D — Internal Subscribers: Chat Mirroring

Use this if someone asks what the event bus bought beyond notifications:

- `packages/api/src/trpc.ts` registers notification handlers once with both `notificationServiceSingleton` and `chatTimelineServiceSingleton`.
- `event-handlers.ts` can call `ChatTimelineService.addSystemMessage(...)` from the same typed event payload that drives notification delivery.
- Chat mirroring is intentionally not the same as push/email delivery; it can still create durable product context even when a user has disabled notification channels.
- `packages/app/features/chat/state/chat-timeline.ts` maps system messages into first-class chat timeline items, so the internal side effect becomes visible product UI.

Core line:

`The event did not just send a message out of the app. It let the app write the same product moment back into itself.`

### Backup E — Push Delivery Details

For provider-mechanics questions:

- token lookup
- valid token filtering
- chunking
- retry for transient failures
- stale token handling
- provider error normalization
- receipt-confirmed delivery vs ticket acceptance
- device-token remediation as a production hardening topic

Core line:

`The service owns delivery mechanics so product flows do not.`

### Backup F — Source Hierarchy

Use current architecture as the source of truth:

- `docs/archive/IMPLEMENTATION_ORDER.md`
- current code anchors above

Use historical plans only as evolution context:

- `plans/NOTIFICATION_REFACTOR_PLAN.md`
- `plans/UNIFIED_SERVICE_API_PLAN.md`

Use future/internal plans only for backup or Q&A:

- `plans/UNIFIED_NOTIFICATION_EFFECT_REFACTOR_PLAN.md`
- `plans/PUSH_NOTIFICATION_DEVICE_REMEDIATION_AND_HARDENING_PLAN.md`

## Drafting Notes

The strongest version of the talk is not:

`I built a notification system.`

It is:

`I thought I was cleaning up notifications. I was actually discovering the event boundary my app needed.`

Keep using Treasure It as the grounding story: solo founder constraints, real Expo app, real delivery bugs, real tap-to-open UX, and product surfaces added over time.

Avoid making third-party tools the villain. The better argument:

`You still need the domain event either way. Build that first. Then decide whether the subscriber is your own notification service, a vendor, or both.`

## Verification Gates Before Deck Finalization

- Exactly one hero flow appears in the final outline.
- No public slide says `55+ notification types`.
- No public slide says exact `69 DB types` unless freshly recomputed and explained.
- Scale wording uses the stage-safe version from this document.
- No slide implies Kafka, durable event sourcing, or guaranteed async queue.
- One old-world failure mode appears before the reframe.
- RN / Expo tap path appears by minute 14.
- Demo rehearses under 3 minutes.
- Demo proves event fired, fan-out happened, and tap landed correctly.
- The before/after code transition does not replace direct calls with a channel-shaped product-service payload.
- At least one slide shows type safety through `DomainEvents[K]` plus Zod runtime validation.
- Chat mirroring is presented as an internal subscriber payoff, not as a separate product-service responsibility.
- Full talk rehearses under 20 minutes.
- Historical, future, and internal refactor items are labeled and not presented as current product behavior.
- Build-vs-buy section clarifies responsibility boundaries and does not dunk on vendors.
- Closing includes the reusable checklist.

## Remaining Decisions

1. Choose the hero flow: `recipient.selected`, `pickup.receiver_completed`, or another concrete product event.
2. Decide whether the recorded walkthrough is fully recorded or live trigger plus recording.
3. Decide whether push receipt hardening and device-token remediation stay in backup slides or appear briefly in the main talk as a production-debugging lesson.
