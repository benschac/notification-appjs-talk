"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes";
import { ShikiMagicMovePrecompiled } from "shiki-magic-move/react";
import type { KeyedTokensInfo } from "shiki-magic-move/core";

import { CodeMorphSlide } from "./code-morph-slide";
import styles from "../styles/deck.module.css";

type TalkSnapshot = {
  apiBaseUrl: string | null;
  generatedAt: string;
};

type RevealEvent = {
  currentSlide?: Element | null;
  fragment?: Element | null;
};

type RevealDeck = {
  off: (eventName: string, callback: (event: RevealEvent) => void) => void;
  on: (eventName: string, callback: (event: RevealEvent) => void) => void;
};

function ProgressiveCodeFrame({
  deck,
  steps,
}: {
  deck: RevealDeck | null;
  steps: KeyedTokensInfo[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!deck || !sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const syncStep = (event: RevealEvent, direction: "forward" | "backward") => {
      const fragment = event.fragment;

      if (!fragment || fragment.closest("section") !== section) {
        return;
      }

      const nextStep = Number(fragment.getAttribute("data-code-step"));

      if (!Number.isFinite(nextStep)) {
        return;
      }

      setStep(direction === "forward" ? nextStep : Math.max(0, nextStep - 1));
    };

    const handleFragmentShown = (event: RevealEvent) => {
      syncStep(event, "forward");
    };

    const handleFragmentHidden = (event: RevealEvent) => {
      syncStep(event, "backward");
    };

    const handleSlideChanged = (event: RevealEvent) => {
      if (event.currentSlide === section) {
        setStep(0);
      }
    };

    deck.on("fragmentshown", handleFragmentShown);
    deck.on("fragmenthidden", handleFragmentHidden);
    deck.on("slidechanged", handleSlideChanged);

    return () => {
      deck.off("fragmentshown", handleFragmentShown);
      deck.off("fragmenthidden", handleFragmentHidden);
      deck.off("slidechanged", handleSlideChanged);
    };
  }, [deck]);

  return (
    <section ref={sectionRef}>
      <p className={styles.eyebrow}>The first version</p>
      <h2 className={styles.sectionTitle}>This code was reasonable</h2>
      <div className={`${styles.magicMoveFrame} ${styles.staticCodeFrame}`}>
        {isMounted ? (
          <ShikiMagicMovePrecompiled
            steps={steps}
            step={step}
            animate
            options={{
              duration: 450,
              lineNumbers: true,
              stagger: 0.1,
            }}
          />
        ) : (
          <div className={styles.magicMovePlaceholder} />
        )}
      </div>
      <p className={styles.caption}>
        It worked until every new surface meant touching the business flow again.
      </p>
      {steps.slice(1).map((_, index) => (
        <span
          key={index + 1}
          aria-hidden="true"
          className={`fragment custom ${styles.codeStepFragment}`}
          data-code-step={index + 1}
        />
      ))}
    </section>
  );
}

export function PresentationDeck({
  codeMorphSteps,
  directSideEffectSteps,
  snapshot,
}: {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
  snapshot: TalkSnapshot;
}) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [deck, setDeck] = useState<RevealDeck | null>(null);

  useEffect(() => {
    if (!deckRef.current) {
      return;
    }

    const deck = new Reveal(deckRef.current, {
      controlsLayout: "edges",
      hash: true,
      plugins: [Notes],
      progress: true,
      slideNumber: "c/t",
      transition: "fade",
      viewDistance: 3,
    });

    void deck.initialize().then(() => {
      setDeck(deck);
    });

    return () => {
      setDeck(null);
      deck.destroy();
    };
  }, []);

  const backendLabel = snapshot.apiBaseUrl ?? "Set PRESENTATION_API_BASE_URL";
  const heroEvent = "[hero event]";
  const destination = "[destination]";

  return (
    <div ref={deckRef} className="reveal">
      <div className="slides">
        <section data-auto-animate>
          <p className={styles.eyebrow}>App.js Conf 2026</p>
          <h1 className={styles.heroTitle}>Emit Once, Notify Everywhere</h1>
          <p className={styles.heroBody}>
            The event bus was the best investment I made in my React Native app.
          </p>
          <div className={styles.metaRow}>
            <span>Treasure It</span>
            <span>{backendLabel}</span>
            <span>{snapshot.generatedAt}</span>
          </div>
          <aside className="notes">
            Frame this as a production React Native story, not a backend
            architecture lecture.
          </aside>
        </section>

        <section>
          <p className={styles.eyebrow}>The user moment</p>
          <h2 className={styles.sectionTitle}>A tap has to land somewhere true</h2>
          <div className={styles.flowRow}>
            <span>{heroEvent}</span>
            <span>notification</span>
            <span>tap</span>
            <span>{destination}</span>
          </div>
          <p className={styles.statement}>
            A notification is not done when it is delivered. It is done when the
            tap lands correctly.
          </p>
          <aside className="notes">
            Keep the hero flow placeholder until the specific flow is chosen.
            Current bias is recipient.selected.
          </aside>
        </section>

        <section>
          <p className={styles.eyebrow}>Hidden work</p>
          <h2 className={styles.sectionTitle}>One visible notification, many product effects</h2>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <h3>Delivery</h3>
              <p>Push, email, preference checks, eligibility rules, provider results.</p>
            </article>
            <article className={styles.card}>
              <h3>Product state</h3>
              <p>Inbox ledger, chat mirror, delivery lifecycle, unread state.</p>
            </article>
            <article className={styles.card}>
              <h3>Mobile routing</h3>
              <p>Deep-link payload, response listener, fallback route, Expo Router destination.</p>
            </article>
          </div>
        </section>

        <ProgressiveCodeFrame deck={deck} steps={directSideEffectSteps} />

        <CodeMorphSlide
          deck={deck}
          frameDataId="event-bus-code-frame"
          fragmentSteps={[1]}
          initialStep={0}
          layout="hero"
          steps={codeMorphSteps}
          subtitle="Start with the version that feels reasonable in a single mutation, then widen it once one more consumer arrives."
          title="Make the architectural change visible"
        />

        <section data-auto-animate>
          <p className={styles.eyebrow}>Reframe</p>
          <h2 className={styles.bigIdea}>The notification is not the thing.</h2>
          <h2 className={styles.bigIdeaAccent}>The event is the thing.</h2>
          <aside className="notes">
            This is the mental model shift. Bring back the refrain here.
          </aside>
        </section>

        <section>
          <p className={styles.eyebrow}>Payloads</p>
          <h2 className={styles.sectionTitle}>Product events need enough truth</h2>
          <div className={styles.payloadGrid}>
            <span>actor / user IDs</span>
            <span>object IDs</span>
            <span>copy inputs</span>
            <span>occurredAt</span>
            <span>conversation context</span>
          </div>
          <pre className={styles.compactCodeBlock}>
            <code>{`this.ctx.eventBus.emit(EVENTS.ITEM_INTEREST.FIRST_SHOWN, {
  userId,
  userName: interestedUser.name || "there",
  gifterId,
  giftId: item.gift_id || undefined,
  giftTitle: item.gift?.name || undefined,
  itemId,
  itemTitle: item.title || undefined,
  shownAt: eventTimestamp,
});`}</code>
          </pre>
          <p className={styles.caption}>
            No push provider. No email provider. No inbox write. This service
            says what happened in the product and stops there.
          </p>
        </section>

        <section>
          <p className={styles.eyebrow}>System shape</p>
          <h2 className={styles.sectionTitle}>One event, many surfaces</h2>
          <div className={styles.architectureFlow}>
            <span>Product action</span>
            <span>Provider-free event</span>
            <span>Zod-validated bus</span>
            <span>Handler / template</span>
            <span>Unified service</span>
            <span>Mobile tap path</span>
          </div>
          <pre className={styles.codeBlock}>
            <code>{`eventBus.emit(DOMAIN_EVENTS.[HERO_EVENT], payload);`}</code>
          </pre>
        </section>

        <section>
          <p className={styles.eyebrow}>Service boundary</p>
          <h2 className={styles.sectionTitle}>Handlers turn truth into intent</h2>
          <pre className={styles.codeBlock}>
            <code>{`createEventHandler(DOMAIN_EVENTS.ITEM_INTEREST.FIRST_SHOWN, async (payload) => {
  await sendNotificationFromTemplate(
    DOMAIN_EVENTS.ITEM_INTEREST.FIRST_SHOWN,
    payload,
    payload.userId,
    notificationService
  );
});`}</code>
          </pre>
          <ul className={styles.checklist}>
            <li>Product services never mention providers.</li>
            <li>Zod validates emitted payloads at runtime.</li>
            <li>Templates choose copy, channels, and destination metadata.</li>
          </ul>
        </section>

        <section>
          <p className={styles.eyebrow}>React Native payoff</p>
          <h2 className={styles.sectionTitle}>The tap path is architecture</h2>
          <div className={styles.timeline}>
            <div>
              <span className={styles.timelineStep}>01</span>
              <p>Notification response listener receives the payload.</p>
            </div>
            <div>
              <span className={styles.timelineStep}>02</span>
              <p>Resolver checks deepLink, screen, legacy type, then inbox fallback.</p>
            </div>
            <div>
              <span className={styles.timelineStep}>03</span>
              <p>Deep-link dispatch hands off to Expo Router.</p>
            </div>
          </div>
          <p className={styles.caption}>
            Delivery is a backend concern. Landing in the right screen is a product concern.
          </p>
        </section>

        <section>
          <p className={styles.eyebrow}>Walkthrough</p>
          <h2 className={styles.sectionTitle}>The demo only has to prove three things</h2>
          <ul className={styles.checklist}>
            <li>The product event fired.</li>
            <li>Notification fan-out happened.</li>
            <li>The tap landed on the intended route.</li>
          </ul>
          <aside className="notes">
            Keep the recording under three minutes. Cut anything that does not
            prove one of these claims.
          </aside>
        </section>

        <section>
          <p className={styles.eyebrow}>Build vs buy</p>
          <h2 className={styles.sectionTitle}>Vendors are useful once your domain event is clear</h2>
          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <h3>Vendors can own</h3>
              <p>Campaigns, templates, segmentation, operations, provider failover.</p>
            </article>
            <article className={styles.card}>
              <h3>Your app still owns</h3>
              <p>What happened, who is eligible, what the tap should do.</p>
            </article>
            <article className={styles.card}>
              <h3>Best combined model</h3>
              <p>A vendor is one subscriber. The product event remains yours.</p>
            </article>
          </div>
        </section>

        <section>
          <p className={styles.eyebrow}>Takeaways</p>
          <h2 className={styles.sectionTitle}>The checklist I use now</h2>
          <ul className={styles.checklist}>
            <li>What happened?</li>
            <li>Who needs to know?</li>
            <li>Which channels should fire?</li>
            <li>What should the tap do?</li>
            <li>What fallback is safe?</li>
            <li>What gets logged?</li>
          </ul>
        </section>

        <section>
          <p className={styles.eyebrow}>Close</p>
          <h2 className={styles.bigIdea}>The event bus was not a notification system.</h2>
          <p className={styles.statement}>
            It was the boundary that made every notification, and every future
            side effect, cheaper.
          </p>
        </section>

        <section>
          <p className={styles.eyebrow}>Backup</p>
          <h2 className={styles.sectionTitle}>Implementation anchors</h2>
          <ul className={styles.sourceList}>
            <li>packages/api/src/events/domain-events.ts</li>
            <li>packages/api/src/events/simple-event-bus.ts</li>
            <li>packages/api/src/services/receiving/interest-management.service.ts</li>
            <li>packages/api/src/services/notifications/event-handlers.ts</li>
            <li>packages/api/src/services/notifications/unified-notification.service.ts</li>
            <li>packages/api/src/services/notifications/notification-templates.ts</li>
            <li>packages/app/provider/notifications/NotificationProvider.native.tsx</li>
            <li>packages/app/services/notificationNavigation.ts</li>
            <li>packages/app/services/deepLinkHandler.ts</li>
          </ul>
        </section>

        <section>
          <p className={styles.eyebrow}>Backup</p>
          <h2 className={styles.sectionTitle}>Type-safety proof points</h2>
          <ul className={styles.sourceList}>
            <li>DomainEvents[K] gives each event name a compile-time payload shape.</li>
            <li>domainEventSchemas[event].payload.parse(payload) validates emitted events.</li>
            <li>domainEventSchemas maps event names to notification types and schemas.</li>
            <li>notification-templates.ts turns validated domain payloads into channel payloads.</li>
            <li>event-handlers.ts is the subscription layer between events and delivery.</li>
          </ul>
        </section>

        <section>
          <p className={styles.eyebrow}>Backup</p>
          <h2 className={styles.sectionTitle}>What this is not</h2>
          <ul className={styles.checklist}>
            <li>Not Kafka.</li>
            <li>Not event sourcing.</li>
            <li>Not a durable messaging queue.</li>
            <li>Not a replacement for every notification vendor.</li>
          </ul>
        </section>

        <section>
          <p className={styles.eyebrow}>Speaker Notes</p>
          <h2 className={styles.sectionTitle}>Speaker view test slide</h2>
          <p className={styles.caption}>
            Open speaker view with <code>S</code>. If the setup is working, the
            audience sees only this slide while the speaker window shows the
            private notes below.
          </p>
          <aside className="notes">
            This is a speaker-notes test.
            Confirm that only the speaker window shows this text.
            Mention the talk title out loud: The event bus is the best investment
            I made in my React Native app.
            Advance one slide after confirming the notes are visible.
          </aside>
        </section>
      </div>
    </div>
  );
}
