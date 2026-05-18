# App.js Conf 2026 20-Minute Talk Skeleton

Working title:

`The event bus is the best investment I made in my React Native app`

Core promise:

This is a production story about notifications, but the deeper lesson is about turning product events into a durable architecture boundary. The audience should leave believing that notifications are not the center of the system. The event is the center, and notifications are one subscriber.

## Timing Model

Target length: 20 minutes.

Recommended structure:

- 5 minutes: problem, stakes, and why the obvious solution breaks
- 9 minutes: event-driven notification architecture
- 3 minutes: demo or animated data-flow walkthrough
- 3 minutes: build-vs-buy boundaries and takeaways

Recommended deck size:

- 14 primary slides
- 3 major animated teaching slides
- 2 optional backup/detail slides after the close

Animated slides count as one slide each, but they should be budgeted as multiple narrative beats.

## Audience Throughline

The talk should keep returning to the user's actual experience:

- a product event happens
- a notification is sent
- the user taps it
- the app opens to the right place
- the inbox, chat, and reminder state stay consistent

The backend architecture matters because it protects that experience. Do not let the middle of the talk become only a backend systems explanation.

## Narrative Spine

### 1. The Moment

Open with one familiar user moment:

Someone finishes a pickup, selects a recipient, nudges a friend, or triggers a reminder. The other user sees a notification, taps it, and lands in the right screen.

The important line:

`This looks like one notification. It is actually several coordinated product side effects.`

What the moment secretly includes:

- push delivery
- transactional email
- in-app inbox state
- chat timeline mirror
- deep-link payload
- Expo Router navigation
- preference and eligibility rules
- delivery lifecycle state

### 2. The Obvious Implementation

The first version looks reasonable:

```ts
await updatePickupStatus(pickupId, "completed");
await sendPush(giverId, pushPayload);
await sendEmail(giverId, emailPayload);
await insertInboxEntry(giverId, inboxPayload);
```

It is not obviously bad. That is the point. It is the kind of code a small team ships because it works.

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

### 4. The Reframe

The notification is not the thing. The event is the thing.

Instead of asking, "Where do I send the notification?" ask:

`What happened in the product, and who needs to react to it?`

That turns this:

```ts
await sendPush(...);
await sendEmail(...);
await insertInboxEntry(...);
await addChatSystemMessage(...);
```

into this:

```ts
await eventBus.emit(DOMAIN_EVENTS.PICKUP.COMPLETED, payload);
```

### 5. The Solution

Domain services emit rich typed events. Handlers subscribe to those events and own side effects.

Core pieces:

- typed domain event contract
- rich payloads
- in-process event bus
- notification event handlers
- unified notification service
- channel-specific delivery services
- mobile tap and deep-link resolver

Key distinction:

This is not Kafka. This is not event sourcing. This is a typed in-process event bus used as an application boundary.

### 6. The Bigger Payoff

Notifications are the first expensive subscriber.

Once the event exists, future subscribers become smaller:

```ts
eventBus.on("pickup.completed", sendNotifications);
eventBus.on("pickup.completed", trackAnalytics);
eventBus.on("pickup.completed", appendAuditLog);
eventBus.on("pickup.completed", notifyPartnerWebhook);
```

The architectural win is not just cleaner notification code. It is making future side effects cheaper and safer.

## Slide Outline

### Slide 1: Title

Time: 30 seconds.

Visual:

- title
- Treasure It
- App.js Conf 2026

Speaker goal:

Set the frame as a production React Native story, not a generic backend architecture talk.

### Slide 2: The User Moment

Time: 1 minute.

Visual:

- phone notification
- tap
- destination screen
- inbox/chat indicator

Speaker goal:

Show that a notification is part of a product workflow, not just a delivery mechanism.

Core line:

`A notification is not done when it is delivered. It is done when the tap lands correctly.`

### Slide 3: What Was Actually Happening

Time: 1 minute.

Visual:

- one visible notification on the left
- hidden side effects on the right

Hidden side effects:

- push
- email
- inbox
- chat system message
- deep link
- reminder state
- delivery lifecycle

Speaker goal:

Make the complexity visible before showing code.

### Slide 4: The Reasonable First Version

Time: 1.5 minutes.

Visual:

- direct-call code snippet

Content:

```ts
await updateGift(...);
await sendPush(...);
await sendEmail(...);
await insertInboxEntry(...);
```

Speaker goal:

Avoid dunking on the first version. It worked until the product had more surfaces.

### Slide 5: Code Morph - Direct Calls Grow

Time: 2.5 minutes.

Animation beats:

1. database mutation
2. add push
3. add email
4. add inbox
5. add chat mirror
6. collapse into one domain event

Speaker goal:

Let the audience feel the architecture getting wider before revealing the simpler boundary.

Core line:

`Every new surface meant touching the business flow again.`

### Slide 6: Reframe

Time: 45 seconds.

Visual:

Large text:

`The notification is not the thing. The event is the thing.`

Speaker goal:

Give the talk its mental model.

### Slide 7: Rich Payloads

Time: 2 minutes.

Visual:

- event schema or payload card

Show fields like:

- `giftId`
- `giverId`
- `recipientId`
- `giftName`
- `actorName`
- `navigationTarget`
- `occurredAt`

Speaker goal:

Explain that handlers should not have to rediscover what happened.

Core line:

`If the handler has to query the database to understand the event, the event is too thin.`

### Slide 8: Animated Data Flow - One Event, Many Surfaces

Time: 3 minutes.

This is the centerpiece slide, similar in spirit to the provided data-flow reference.

Layout:

- left: product action
- center-left: domain event bus
- center: typed event payload card
- center-right: notification handler and unified service
- right: output surfaces
- bottom: mobile tap path

Animation beats:

1. Product action appears:
   `Pickup completed`

2. Arrow into event bus:
   `eventBus.emit("pickup.completed", payload)`

3. Payload card appears:
   `giverId`, `giftId`, `giftName`, `deepLink`, `completedAt`

4. Notification handler appears:
   `on pickup.completed -> build channel payloads`

5. Unified service appears:
   `notificationService.send(userId, type, channels)`

6. Fan-out appears:
   `push`, `email`, `in-app inbox`, `chat mirror`

7. Future subscribers appear:
   `analytics`, `audit log`, `webhook`, `CRM`

8. Mobile tap path appears:
   `push response -> deep-link resolver -> Expo Router`

Speaker goal:

Show the whole system without making it feel like a giant platform rewrite.

Core line:

`The event bus is small. The leverage comes from where it sits.`

### Slide 9: Unified Notification Service

Time: 2 minutes.

Visual:

- focused code snippet from `unified-notification.service.ts`
- simplified call shape

Show:

```ts
await notificationService.send(userId, type, {
  push,
  email,
  inApp,
});
```

Speaker goal:

Explain why the event handler should prepare intent, while the notification service owns channel delivery and lifecycle results.

Points:

- call-site simplicity
- consistent result envelope
- delivered/failed/skipped events
- channel aggregation
- channel-specific services stay replaceable

### Slide 10: Push Delivery Details

Time: 1.5 minutes.

Visual:

- small focused code or flow

Show concepts from `push/index.ts`:

- token lookup
- valid token filtering
- chunking
- retry for transient failures
- stale token handling
- provider error normalization

Speaker goal:

Prove this is production-shaped without spending too long in provider details.

Core line:

`The service owns delivery mechanics so product flows do not.`

### Slide 11: The React Native Tap Path

Time: 2 minutes.

Visual:

- notification payload
- response listener
- deep-link resolver
- Expo Router destination

Animation beats:

1. notification arrives
2. user taps
3. app receives response
4. payload resolves to route
5. Expo Router navigates

Speaker goal:

Bring the architecture back to App.js and React Native.

Core line:

`Delivery is a backend concern. Landing in the right screen is a product concern. The payload connects them.`

### Slide 12: Demo Or Live Walkthrough

Time: 3 minutes.

Preferred demo:

1. trigger one real domain event
2. show notification or simulated delivery
3. tap into correct screen
4. show inbox/chat state
5. show that the business flow emitted one event

Backup:

- pre-recorded device capture
- animated data-flow replay
- log output showing event -> handler -> service

Speaker goal:

Prove the pattern with one complete user path.

### Slide 13: Why Not Just Use A Third-Party Notification Service?

Time: 2 minutes.

This should not be defensive. The right answer is not "never use one." The right answer is "know which problem you are solving."

Third-party services are strong at:

- campaign orchestration
- template editing by non-engineers
- segmentation
- cross-channel messaging operations
- analytics dashboards
- provider failover and compliance workflows
- marketing lifecycle messaging

They are weaker as the only place to encode product truth:

- they do not know your domain model unless you model it for them
- they still need rich events
- they still need correct deep links
- they still need product-specific eligibility rules
- they should not become the only source of app navigation logic

Core line:

`A third-party service can deliver messages. It cannot decide what happened in your product unless your product tells it clearly.`

### Slide 14: When To Build Vs Buy

Time: 1.5 minutes.

Build this application-level event layer when:

- notifications are part of core product UX
- tap destination correctness matters
- multiple product surfaces need to react to the same event
- engineers own the notification logic
- you need typed payloads and app-specific behavior
- you want analytics, audit logs, and future side effects to reuse the same trigger

Use a third-party notification platform when:

- non-engineers need to edit templates and campaigns
- marketing lifecycle messaging is the main problem
- segmentation and experimentation matter more than app-specific coordination
- compliance, provider failover, or delivery analytics are core requirements
- you need multi-channel operations beyond what a small team should maintain

Best combined model:

- your app emits typed domain events
- your app owns product eligibility and deep links
- your event handlers can call a third-party service as one subscriber
- the third-party service owns message operations, not product truth

Speaker goal:

Give a pragmatic decision framework instead of a false build-vs-buy binary.

### Slide 15: Takeaways

Time: 1 minute.

Takeaways:

1. Emit events, not side effects.
2. Put enough truth in the payload.
3. Treat notification taps as part of the architecture.
4. Buy delivery tooling when operations become the hard part, not before the domain contract exists.

Closing line:

`The event bus was not a notification system. It was the boundary that made every notification, and every future side effect, cheaper.`

## Backup Slides

### Backup A: Code Anchors

Purpose:

Have a slide ready if someone wants the concrete implementation map.

Files:

- `packages/api/src/events/domain-events.ts`
- `packages/api/src/services/notifications/unified-notification.service.ts`
- `packages/api/src/services/notifications/push/index.ts`
- `packages/api/src/services/notifications/event-handlers.ts`
- `packages/app/provider/notifications/NotificationProvider.native.tsx`
- `packages/app/services/notificationNavigation.ts`

### Backup B: What This Is Not

Purpose:

Avoid overclaiming.

This is not:

- Kafka
- event sourcing
- a distributed workflow engine
- a replacement for all notification vendors
- a generic messaging platform

This is:

- a typed application event boundary
- a way to keep product flows clean
- a way to make notification side effects explicit and testable

## Drafting Notes

The strongest version of the talk is not "I built a notification system."

The strongest version is:

`I thought I was cleaning up notifications. I was actually discovering the event boundary my app needed.`

Keep using Treasure It as the grounding story:

- solo founder constraints
- real Expo app
- real delivery bugs
- real tap-to-open UX
- product surfaces added over time

Avoid making third-party tools the villain. The better argument is:

`You still need the domain event either way. Build that first. Then decide whether the subscriber is your own notification service, a vendor, or both.`
