"use client";

import { Deck } from "@revealjs/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Notes from "reveal.js/plugin/notes";
import { ShikiMagicMovePrecompiled } from "shiki-magic-move/react";
import type { RevealApi, RevealConfig, RevealPlugin, RevealPluginFactory } from "reveal.js";
import type { KeyedTokensInfo } from "shiki-magic-move/core";

import {
  createRevealAnythingPlugin,
  type AnythingRevealConfig,
} from "./reveal-anything-plugin";
import { CodeMorphSlide } from "./code-morph-slide";
import cryingImage from "./crying.png";
import domainDrivenDesignImage from "./ddd.jpeg";
import headshotImage from "./headshot.jpeg";
import mirroredChatImage from "./mirrored_chat.jpeg";
import moosePmImage from "./moose_pm.png";
import notificationIllustration from "./notif_illistration.png";
import preferencesImage from "./preferences.png";
import saltBaeTypescriptImage from "./saltbaets.jpeg";
import treasureBagImage from "./Longarms.png";
import vennDiagramImage from "./vendiagram.png";
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

type MermaidRevealConfig = RevealConfig &
  AnythingRevealConfig & {
  mermaid?: {
    securityLevel?: "strict" | "loose" | "antiscript" | "sandbox";
    startOnLoad?: boolean;
    theme?: "base" | "dark" | "default" | "forest" | "neutral" | "null";
    themeVariables?: Record<string, string | boolean | number>;
  };
  mermaidPlugin?: {
    afterRender?: (element: Element) => void;
    beforeRender?: (element: Element) => boolean | void;
    iconPacks?: unknown[];
  };
};

type DeckPlugin = RevealPlugin | RevealPluginFactory;

function MermaidBlock({ chart, className = "" }: { chart: string; className?: string }) {
  return (
    <div className={`mermaid ${styles.mermaidDiagram} ${className}`} data-mermaid-source={chart}>
      <pre>{chart}</pre>
    </div>
  );
}

const notificationTypes = [
  "interest_shown",
  "first_interest_shown",
  "first_interest_no_profile_picture",
  "item_interest_toggled",
  "chosen",
  "not_chosen",
  "auto_scheduled_pickup",
  "confirmed_pickup_time",
  "five_minutes_late",
  "ten_minutes_late",
  "fifteen_minutes_late",
  "twenty_minutes_late",
  "thirty_minutes_late",
  "receiver_no_show",
  "giver_no_show",
  "nudge_recipient",
  "post_deleted",
  "gift_items_updated",
  "chat_message",
  "comment_received",
  "comment_reply_received",
  "seller_offer_received",
  "buyer_match_credit_requested",
  "watched_item_price_changed",
  "watched_item_still_available",
  "watched_item_status_changed",
  "watched_offer_status_changed",
  "watched_competing_offer_unavailable",
  "paid_pickup_scheduling_update",
  "friend_request_received",
  "friend_request_accepted",
  "friend_request_rejected",
  "friend_removed",
  "friend_gift_posted",
  "group_invite_received",
  "group_invite_accepted",
  "group_join_requested",
  "group_join_approved",
  "group_join_rejected",
  "group_member_removed",
  "group_member_blocked",
  "group_post_shared",
  "chosen_removed_interest",
  "removed_recipient",
  "gift_post_created",
  "item_deleted",
  "pickup_auto_mark_warning",
  "pickup_auto_mark_completed",
  "gift_simmer_expiring",
  "gift_simmer_window_ended",
  "pickup_reschedule_requested",
  "pickup_reschedule_responded",
  "pickup_note_added",
  "pickup_note_updated",
  "marked_taken_without_schedule",
  "pickup_address_requested",
  "pickup_address_approved",
  "pickup_address_denied",
  "picked_up",
  "gift_picked_up",
  "gift_has_been_picked_up",
  "waiting_for_schedule",
  "picked_availability",
  "availability_removal",
  "removed",
  "removed_recipient",
  "backed_out",
  "flash_pickup_scheduled",
  "pickup_rescheduled",
  "availability_updated",
  "schedule_reminder",
  "schedule_time_reminder",
  "pickup_reminder",
  "welcome",
  "on_my_way",
  "arrived",
  "giver_completed",
  "receiver_completed",
  "cancel_pickup",
  "removed_interest",
  "test_notification",
  "pickup_address_unlock",
  "publish_post_requested",
  "publish_post_approved",
  "publish_post_rejected",
];

function initializeExternalDocFrame(element: HTMLElement) {
  const existingIframe = element.querySelector("iframe");

  if (existingIframe) {
    return;
  }

  const rawConfig = element.innerHTML.trim().match(/<!--([\s\S]*?)-->/)?.[1] ?? "{}";
  let options: Record<string, unknown> = {};

  try {
    options = JSON.parse(rawConfig);
  } catch {
    options = {};
  }

  const src =
    typeof options.src === "string" ? options.src : "https://revealjs.com/react/";
  const title =
    typeof options.title === "string" ? options.title : "External reference";
  const allow = typeof options.allow === "string" ? options.allow : "fullscreen";

  const header = document.createElement("div");
  header.className = styles.externalDocHeader;

  const label = document.createElement("span");
  label.textContent = title;
  header.append(label);

  const link = document.createElement("a");
  link.href = src;
  link.rel = "noreferrer";
  link.target = "_blank";
  link.textContent = "Open";
  header.append(link);

  const iframe = document.createElement("iframe");
  iframe.allow = allow;
  iframe.className = styles.externalDocIframe;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "no-referrer";
  iframe.sandbox.add(
    "allow-forms",
    "allow-popups",
    "allow-popups-to-escape-sandbox",
    "allow-same-origin",
    "allow-scripts",
  );
  iframe.src = src;
  iframe.title = title;

  element.replaceChildren(header, iframe);
}

function ExternalDocFrame({
  className,
  src,
  title,
}: {
  className?: string;
  src: string;
  title: string;
}) {
  return (
    <div className={`${styles.externalDocFrame} ${className ?? ""}`}>
      <div className={styles.externalDocHeader}>
        <span>{title}</span>
        <a href={src} rel="noreferrer" target="_blank">
          Open
        </a>
      </div>
      <iframe
        allow="fullscreen"
        className={styles.externalDocIframe}
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        src={src}
        title={title}
      />
    </div>
  );
}

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
      <div className={styles.progressiveCodeLayout}>
        <div className={styles.progressiveCodeCopy}>
          <p className={styles.eyebrow}>The first version</p>
          <h2 className={styles.sectionTitle}>This code was reasonable</h2>
        </div>
        <div
          data-id="event-bus-code-frame"
          className={`${styles.magicMoveFrame} ${styles.staticCodeFrame}`}
        >
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
      </div>
      {steps.slice(1).map((_, index) => (
        <span
          key={index + 1}
          aria-hidden="true"
          className={`fragment custom ${styles.codeStepFragment}`}
          data-code-step={index + 1}
        />
      ))}
        <aside className="notes">
        You start with your business logic. Then you add your notification.Life is good. Problem solved. Then you realize that a bunch of your users don't have notifs on, so you're going to send them an email. But then you realize they might have their emails off, so then you put it in the in-app notifications. Then you realize that in-app notifs are getting really noisy, so you should probably just append this really important message to their chat with the other user. Then you realize you should probably be measuring this in your analytics tool. But also, the rest of your team might want to see this on Slack, so we're going to add a webhook too.
        </aside>
    </section>
  );
}

function StaticHighlightedCodeBlock({ steps }: { steps: KeyedTokensInfo[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={`${styles.magicMoveFrame} ${styles.staticHighlightedCodeBlock}`}>
      {isMounted ? (
        <ShikiMagicMovePrecompiled
          steps={steps}
          step={0}
          options={{
            lineNumbers: false,
          }}
        />
      ) : (
        <div className={styles.magicMovePlaceholder} />
      )}
    </div>
  );
}

export function PresentationDeck({
  codeMorphSteps,
  directSideEffectSteps,
  eventEmitStep,
  snapshot,
}: {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
  eventEmitStep: KeyedTokensInfo[];
  snapshot: TalkSnapshot;
}) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [deck, setDeck] = useState<RevealDeck | null>(null);
  const [plugins, setPlugins] = useState<DeckPlugin[] | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPlugins = async () => {
      const { default: RevealHighlight } = await import("reveal.js/plugin/highlight");
      const { default: RevealMermaid } = await import(
        "reveal.js-mermaid-plugin/plugin/mermaid/mermaid.esm.js"
      );

      if (isCancelled) {
        return;
      }

      setPlugins([Notes, RevealHighlight, RevealMermaid, createRevealAnythingPlugin()]);
    };

    void loadPlugins();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const initializeExternalDocs = () => {
      for (const element of Array.from(document.getElementsByClassName("external-doc"))) {
        if (element instanceof HTMLElement) {
          initializeExternalDocFrame(element);
        }
      }
    };

    initializeExternalDocs();
    requestAnimationFrame(initializeExternalDocs);
  }, [plugins]);

  const revealConfig = useMemo<MermaidRevealConfig>(
    () => ({
      controlsLayout: "edges",
      hash: true,
      mermaid: {
        securityLevel: "strict",
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          darkMode: true,
          fontFamily: "IBM Plex Mono, SFMono-Regular, Menlo, monospace",
          lineColor: "#f2a65a",
          primaryColor: "#1b2a45",
          primaryTextColor: "#fbf8f2",
          tertiaryColor: "#0d1933",
        },
      },
      mermaidPlugin: {
        beforeRender(element) {
          if (!(element instanceof HTMLElement)) {
            return;
          }

          const source = element.dataset.mermaidSource;

          if (!source) {
            return;
          }

          const pre = document.createElement("pre");
          pre.textContent = source;
          element.replaceChildren(pre);
        },
      },
      anything: [
        {
          className: "external-doc",
          defaults: {
            allow: "fullscreen",
            src: "https://revealjs.com/react/",
            title: "External reference",
          },
          initialize(container, options) {
            container.innerHTML = `<!-- ${JSON.stringify(options)} -->`;
            initializeExternalDocFrame(container);
          },
        },
      ],
      progress: true,
      slideNumber: "c/t",
      transition: "fade",
      viewDistance: 3,
    }),
    [],
  );

  const handleReady = (readyDeck: RevealApi) => {
    setDeck(readyDeck);
  };

  const backendLabel = snapshot.apiBaseUrl ?? "Set PRESENTATION_API_BASE_URL";
  const heroEvent = "[hero event]";
  const destination = "[destination]";

  const slides = (
    <>
      <section data-auto-animate>
        <p className={styles.eyebrow}>App.js Conf 2026</p>
        <h1 className={styles.heroTitle}>Emit Once, Notify Everywhere</h1>
        <aside className="notes">
          Frame this as a production React Native story, not a backend
          architecture lecture.
        </aside>
      </section>

      <section>
        <div className={styles.introLayout}>
          <div>
            <p className={styles.eyebrow}>Intro</p>
            <h2 className={styles.bigIdea}>Hi, I&apos;m Ben.</h2>
            <p className={styles.statement}>
              I&apos;m building Treasure It, a marketplace for P2P hyperlocal commerce
            </p>
          </div>
          <div className={styles.introImages}>
            <Image
              alt="Ben"
              className={styles.introHeadshot}
              sizes="15rem"
              src={headshotImage}
            />
            <Image
              alt="Treasure It marketplace exchange illustration"
              className={styles.introBag}
              sizes="28rem"
              src={treasureBagImage}
            />
          </div>
        </div>
      </section>

      <section>
        <div className={styles.marketplaceNotificationLayout}>
          <div>
            <p className={styles.eyebrow}>Marketplace reality</p>
            <h2 className={styles.bigIdea}>
              Notifications take center stage.
            </h2>
          </div>
          <Image
            alt="Marketplace notifications connecting store, calendar, and package activity"
            className={styles.marketplaceNotificationImage}
            priority
            sizes="34rem"
            src={notificationIllustration}
          />
        </div>
      </section>

      <section>
        <p className={styles.eyebrow}>The story begins here</p>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://docs.expo.dev/versions/latest/sdk/notifications/"
          title="Expo Notifications docs"
        />
        <aside className="notes">
        When I was reading the request for proposals, the only requirement was using an Expo service, and I said, I bet I could sneak a backend talk into a React Native conference. "Hold my notification."
        </aside>
      </section>

      <ProgressiveCodeFrame deck={deck} steps={directSideEffectSteps} />

      <CodeMorphSlide
        deck={deck}
        frameDataId="event-bus-code-frame"
        fragmentSteps={[2]}
        initialStep={1}
        layout="hero"
        showCopy={false}
        steps={codeMorphSteps}
        subtitle=""
        title=""
      />

      <section>
        <p className={styles.eyebrow}>Scale pressure</p>
        <h2 className={styles.notificationTypeTitle}>
          What happens when you have 84 different notification type values?
        </h2>
        <div className={styles.notificationTypeCloud}>
          {notificationTypes.map((type, index) => (
            <span
              key={`${type}-${index}`}
              className={`fragment ${styles.notificationTypeBubble}`}
              data-fragment-index={Math.floor(index / 10)}
            >
              {type}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          What happens when you need to derive multiple notifications from a single event?
        </h2>
      </section>

      <section className={styles.centeredContentSlide}>
        <p className={styles.eyebrow}>Derived notifications</p>
        <MermaidBlock
          chart={`flowchart LR
    A["recipient.switched"] --> B["removed_recipient<br/>old recipient"]
    A --> C["chosen<br/>new recipient"]`}
          className={styles.derivedNotificationDiagram}
        />
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          What happens when you need to support in-app notifications?
        </h2>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.chatNotificationLayout}>
          <h2 className={styles.chatNotificationTitle}>Or in chat notifications</h2>
          <Image
            alt="Treasure It in-chat notification timeline"
            className={styles.chatNotificationImage}
            sizes="32rem"
            src={mirroredChatImage}
          />
        </div>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          Oh, and some notifications are only for premium users.
        </h2>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.preferencesLayout}>
          <h2 className={styles.preferencesTitle}>Don't forget about your users' preferences.</h2>
          <Image
            alt="Treasure It notification preferences screen"
            className={styles.preferencesImage}
            sizes="30rem"
            src={preferencesImage}
          />
        </div>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.pmAnalyticsLayout}>
          <h2 className={styles.pmAnalyticsTitle}>
            Your product manager needs this in analytics and purchases above $20 auto-posted on Slack.
          </h2>
          <Image
            alt="Product manager dog with roadmap notes and notification demands"
            className={styles.pmAnalyticsImage}
            sizes="32rem"
            src={moosePmImage}
          />
        </div>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.cornerCryLayout}>
          <div>
            <p className={styles.eyebrow}>Scale pressure</p>
            <h2 className={styles.bigIdea}>Go in the corner and cry.</h2>
          </div>
          <Image
            alt="Crying reaction to notification scale"
            className={styles.cornerCryImage}
            sizes="30rem"
            src={cryingImage}
          />
        </div>
      </section>

      <section>
        <p className={styles.eyebrow}>I Started thinking about Redux</p>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://redux.js.org/introduction/why-rtk-is-redux-today#what-does-the-redux-core-do"
          title="Redux core docs"
        />
      </section>

      <section>
        <p className={styles.eyebrow}>Then I started thinking</p>
        <h2 className={styles.reduxDocTitle}>What about actions and action creators?</h2>
        <ExternalDocFrame
          className={styles.reduxDocFrame}
          src="https://redux.js.org/usage/reducing-boilerplate#generating-action-creators"
          title="Redux action creators docs"
        />
      </section>

      <section>
        <p className={styles.eyebrow}>Then the shape</p>
        <h2 className={styles.fsaTitle}>Flux Standard Action</h2>
        <div className={styles.fsaLayout}>
          <div className={styles.fsaExamples}>
            <pre className={styles.compactCodeBlock}>
              <code>{`{
  type: "ADD_TODO",
  payload: {
    text: "Do something."
  }
}`}</code>
            </pre>
            <pre className={styles.compactCodeBlock}>
              <code>{`{
  type: "ADD_TODO",
  payload: new Error(),
  error: true
}`}</code>
            </pre>
          </div>
          <div className={styles.fsaRules}>
            <p>An action must be a plain object with a type.</p>
            <p>It may include payload, error, and meta.</p>
            <p>It must not include anything else.</p>
          </div>
        </div>
      </section>

      <section>
        <p className={styles.eyebrow}>Then the language</p>
        <h2 className={styles.reduxDocTitle}>Domain-Driven Design</h2>
        <Image
          alt="Domain-Driven Design book cover"
          className={styles.dddCoverImage}
          sizes="24rem"
          src={domainDrivenDesignImage}
        />
      </section>

      <section className={styles.centeredContentSlide}>
        <p className={styles.eyebrow}>Then the mechanism</p>
        <h2 className={styles.eventEmitterTitle}>EventEmitter3</h2>
        <div className={styles.eventEmitterLayout}>
          <div>
            <p className={styles.eventEmitterStatement}>
              A small, fast EventEmitter became the in-process event bus.
            </p>
            <ul className={styles.eventEmitterList}>
              <li>Emit product events by name.</li>
              <li>Subscribe side effects outside the product flow.</li>
              <li>Keep the bus local, typed, and boring.</li>
            </ul>
          </div>
          <pre className={styles.eventEmitterCode}>
            <code className="language-js">{`import EventEmitter from "eventemitter3";

const eventBus = new EventEmitter();

eventBus.on("item.bid.received", notifySeller);
eventBus.on("item.bid.received", mirrorIntoChat);
eventBus.on("item.bid.received", trackAnalytics);

eventBus.emit("item.bid.received", payload);`}</code>
          </pre>
        </div>
      </section>


      <section>
        <p className={styles.eyebrow}>Then the guarantee</p>
        <h2 className={styles.reduxDocTitle}>Type-Driven Design</h2>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/"
          title="Parse, don't validate"
        />
      </section>

      <section>
        <p className={styles.eyebrow}>And a schema</p>
        <h2 className={styles.reduxDocTitle}>Parse don't validate</h2>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://zod.dev/basics?id=parsing-data#parsing-data"
          title="Zod docs"
        />
      </section>
      <section className={styles.fullBleedImageSlide}>
        <Image
          alt="Salt Bae sprinkling TypeScript"
          className={styles.fullBleedMemeImage}
          priority
          sizes="100vw"
          src={saltBaeTypescriptImage}
        />
      </section>

      <section className={styles.centeredContentSlide}>
        <h2 className={styles.fullWidthPunchline}>Just steal their ideas.</h2>
      </section>

      <section>
        <Image
          alt="Venn diagram showing Flux Actions, Event Bus, and Domain Events overlapping into a new idea"
          className={styles.vennImage}
          priority
          sizes="78rem"
          src={vennDiagramImage}
        />
      </section>

      <section className={styles.centeredContentSlide}>
        <MermaidBlock
          chart={`graph TB
    Service[Domain service] --> EventBus[Event bus]
    EventBus --> Handler[Notification handler]

    Handler --> Unified[Unified notification service]
    Unified --> Prefs[Preference and group checks]
    Prefs --> Push[Push delivery]
    Prefs --> Email[Email queue with fallback]

    Unified --> Ledger[Notification ledger]
    Ledger --> Inbox[In-app inbox reads]
    Inbox --> InboxApi[listInbox / unread / read mutations]

    Handler --> ChatMirror[Chat mirror path]
    ChatMirror --> Timeline[ChatTimelineService.addSystemMessage]

    Push --> Expo[Expo push API]
    Email --> Provider[Email provider]

    classDef userLayer fill:#e1f5fe,color:#111827,stroke:#7dd3fc
    classDef eventLayer fill:#fff3e0,color:#111827,stroke:#f2a65a
    classDef notifyLayer fill:#e8f5e8,color:#111827,stroke:#86efac
    classDef storageLayer fill:#f1f8e9,color:#111827,stroke:#bef264
    classDef extLayer fill:#fce4ec,color:#111827,stroke:#f9a8d4

    class Service userLayer
    class EventBus,Handler eventLayer
    class Unified,Prefs,Push,Email,ChatMirror,Timeline notifyLayer
    class Ledger,Inbox,InboxApi storageLayer
    class Expo,Provider extLayer`}
          className={styles.solutionMermaidDiagram}
        />
      </section>

      <section>
        <p className={styles.eyebrow}>Step 1</p>
        <h2 className={styles.sectionTitle}>Emit the event</h2>
        <StaticHighlightedCodeBlock steps={eventEmitStep} />
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

      <section className={styles.centeredContentSlide}>
        <p className={styles.eyebrow}>System shape</p>
        <h2 className={styles.sectionTitle}>One event, many surfaces</h2>
        <MermaidBlock
          chart={`flowchart LR
  action[Product action] --> event[Provider-free event]
  event --> bus[Zod-validated bus]
  bus --> push[Push]
  bus --> email[Email]
  bus --> inbox[Inbox]
  bus --> tap[Mobile tap path]`}
        />
        <pre className={styles.codeBlock}>
          <code>{`eventBus.emit(DOMAIN_EVENTS.[HERO_EVENT], payload);`}</code>
        </pre>
      </section>

      <section>
        <p className={styles.eyebrow}>Reference surface</p>
        <h2 className={styles.sectionTitle}>Pull docs into the room</h2>
        <div
          className={`external-doc ${styles.externalDocFrame}`}
          dangerouslySetInnerHTML={{
            __html: `<!-- {
              "src": "https://revealjs.com/react/",
              "title": "Reveal React docs"
            } -->`,
          }}
        />
        <p className={styles.caption}>
          Anything turns this comment-configured placeholder into an iframe,
          while the slide keeps a direct fallback link.
        </p>
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
    </>
  );

  if (!plugins) {
    return (
      <div ref={deckRef} className="reveal">
        <div className="slides">{slides}</div>
      </div>
    );
  }

  return (
    <Deck
      config={revealConfig}
      onReady={handleReady}
      plugins={plugins}
    >
      {slides}
    </Deck>
  );
}
