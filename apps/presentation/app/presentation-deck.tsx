"use client";

import { Deck } from "@revealjs/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import Notes from "reveal.js/plugin/notes";
import { ShikiMagicMovePrecompiled } from "shiki-magic-move/react";
import type {
  RevealApi,
  RevealConfig,
  RevealPlugin,
  RevealPluginFactory,
} from "reveal.js";
import type { KeyedTokensInfo } from "shiki-magic-move/core";

import {
  createRevealAnythingPlugin,
  type AnythingRevealConfig,
} from "./reveal-anything-plugin";
import { CodeMorphSlide } from "./code-morph-slide";
import cellCaseImage from "./cell_case.jpeg";
import cryingImage from "./crying.png";
import domainDrivenDesignImage from "./ddd.jpeg";
import errorEventPayloadImage from "./error_event_payload.png";
import expoDocsHomepageImage from "./expo-docs-homepage.png";
import headshotImage from "./headshot.jpeg";
import inAppNotificationsImage from "./inapp_notifs.png";
import mirroredChatImage from "./mirrored_chat.jpeg";
import moosePmImage from "./moose_pm.png";
import notificationCenterImage from "./notifs_phone_screen.jpeg";
import jebThankYouImage from "./jeb.gif";
import notificationServiceProvidersImage from "./legos2.png";
import notificationIllustration from "./notif_illistration.png";
import notificationOffImage from "./notif_off.png";
import knockLogoImage from "./knocklogo.png";
import oneSignalLogoImage from "./onesignal.png";
import preferencesImage from "./preferences.png";
import saltBaeTypescriptImage from "./saltbaets.jpeg";
import standardActionImage from "./standard_action.png";
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

const codeMorphOptions = {
  animateContainer: false,
  containerStyle: false,
  duration: 750,
  lineNumbers: false,
  stagger: 3,
};

function MermaidBlock({
  chart,
  className = "",
}: {
  chart: string;
  className?: string;
}) {
  return (
    <div
      className={`mermaid ${styles.mermaidDiagram} ${className}`}
      data-mermaid-source={chart}
    >
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
  "item_bid_received",
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

const INITIAL_NOTIFICATION_REVEAL_COUNT = 1;
const NOTIFICATION_REVEAL_MILESTONES = [2, 3, 4] as const;
const CLOUD_ANIMATION_DURATION = 680;
const CLOUD_FULL_REVEAL_ANIMATION_DURATION = 980;
const HIDDEN_NOTIFICATION_BUBBLE_TRANSFORM =
  "translate3d(0px, 36px, -180px) rotateX(8deg) rotateY(2deg) scale(0.68)";
const VISIBLE_NOTIFICATION_BUBBLE_TRANSFORM =
  "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) scale(1)";

function clampNotificationRevealCount(count: number, totalCount: number) {
  return Math.min(
    Math.max(INITIAL_NOTIFICATION_REVEAL_COUNT, count),
    totalCount,
  );
}

function getNotificationRevealCounts(totalCount: number) {
  return Array.from(
    new Set(
      [...NOTIFICATION_REVEAL_MILESTONES, totalCount].filter(
        (count) =>
          count > INITIAL_NOTIFICATION_REVEAL_COUNT && count <= totalCount,
      ),
    ),
  );
}

function hideNotificationBubble(bubble: HTMLSpanElement) {
  bubble.style.opacity = "0";
  bubble.style.transform = HIDDEN_NOTIFICATION_BUBBLE_TRANSFORM;
  bubble.style.filter = "blur(8px)";
}

function showNotificationBubble(bubble: HTMLSpanElement) {
  bubble.style.opacity = "1";
  bubble.style.transform = VISIBLE_NOTIFICATION_BUBBLE_TRANSFORM;
  bubble.style.filter = "blur(0px)";
}

function NotificationTypeCloudSection({
  deck,
  types,
}: {
  deck: RevealDeck | null;
  types: string[];
}) {
  const uniqueTypes = useMemo(() => Array.from(new Set(types)), [types]);
  const revealCounts = useMemo(
    () => getNotificationRevealCounts(uniqueTypes.length),
    [uniqueTypes.length],
  );
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_NOTIFICATION_REVEAL_COUNT,
  );
  const sectionRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const animatedCountRef = useRef(0);
  const visibleCountRef = useRef(INITIAL_NOTIFICATION_REVEAL_COUNT);
  const hasTriggeredRef = useRef(false);

  const resetBubbles = useCallback(() => {
    const cloud = cloudRef.current;

    if (!cloud) {
      return;
    }

    for (const child of Array.from(cloud.children)) {
      if (!(child instanceof HTMLSpanElement)) {
        continue;
      }

      hideNotificationBubble(child);
    }

    animatedCountRef.current = 0;
  }, []);

  const revealNotificationCount = useCallback(
    (
      requestedCount: number,
      options: { animateFromCurrent?: boolean } = {},
    ) => {
      const cloud = cloudRef.current;
      const section = sectionRef.current;

      if (!cloud || !section) {
        return;
      }

      const bubbles = Array.from(cloud.children).filter(
        (child): child is HTMLSpanElement => child instanceof HTMLSpanElement,
      );
      const nextCount = clampNotificationRevealCount(
        requestedCount,
        bubbles.length,
      );
      const shouldAnimateFromCurrent = options.animateFromCurrent ?? true;
      const isPresent = section.classList.contains("present");

      visibleCountRef.current = nextCount;
      setVisibleCount(nextCount);
      animationRef.current?.pause();

      if (!isPresent) {
        return;
      }

      const previousCount = shouldAnimateFromCurrent
        ? Math.min(animatedCountRef.current, nextCount)
        : 0;

      bubbles.forEach((bubble, index) => {
        if (index < previousCount) {
          showNotificationBubble(bubble);
          return;
        }

        hideNotificationBubble(bubble);
      });

      const enteringBubbles = bubbles.slice(previousCount, nextCount);

      if (enteringBubbles.length === 0) {
        animatedCountRef.current = nextCount;
        return;
      }

      const isFullReveal = nextCount === bubbles.length;
      const nextAnimation = animate(enteringBubbles, {
        autoplay: false,
        duration: isFullReveal
          ? CLOUD_FULL_REVEAL_ANIMATION_DURATION
          : CLOUD_ANIMATION_DURATION,
        delay: stagger(isFullReveal ? 8 : 80),
        easing: "out-cubic",
        opacity: [0, 1],
        translateY: [36, 0],
        translateZ: [-180, 0],
        rotateX: [8, 0],
        rotateY: [2, 0],
        scale: [0.68, 1],
        filter: ["blur(8px)", "blur(0px)"],
      });

      const hfAnimeHost = window as Window & {
        __hfAnime?: ReturnType<typeof animate>[];
      };
      hfAnimeHost.__hfAnime = hfAnimeHost.__hfAnime || [];
      hfAnimeHost.__hfAnime.push(nextAnimation);

      animationRef.current = nextAnimation;
      animationRef.current.pause();
      animationRef.current.seek(0);
      animationRef.current.play();
      animatedCountRef.current = nextCount;
    },
    [],
  );

  useEffect(() => {
    if (!deck || !sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const getPreviousCount = (count: number) => {
      const countIndex = revealCounts.indexOf(count);

      return countIndex > 0
        ? revealCounts[countIndex - 1]
        : INITIAL_NOTIFICATION_REVEAL_COUNT;
    };

    const syncCount = (
      event: RevealEvent,
      direction: "forward" | "backward",
    ) => {
      const fragment = event.fragment;

      if (!fragment || fragment.closest("section") !== section) {
        return;
      }

      const nextCount = Number(
        fragment.getAttribute("data-notification-type-count"),
      );

      if (!Number.isFinite(nextCount)) {
        return;
      }

      revealNotificationCount(
        direction === "forward" ? nextCount : getPreviousCount(nextCount),
      );
    };

    const handleFragmentShown = (event: RevealEvent) => {
      syncCount(event, "forward");
    };

    const handleFragmentHidden = (event: RevealEvent) => {
      syncCount(event, "backward");
    };

    const handleSlideChanged = (event: RevealEvent) => {
      if (event.currentSlide !== section || hasTriggeredRef.current) {
        return;
      }

      hasTriggeredRef.current = true;
      revealNotificationCount(INITIAL_NOTIFICATION_REVEAL_COUNT, {
        animateFromCurrent: false,
      });
    };

    deck.on("fragmentshown", handleFragmentShown);
    deck.on("fragmenthidden", handleFragmentHidden);
    deck.on("slidechanged", handleSlideChanged);

    return () => {
      deck.off("fragmentshown", handleFragmentShown);
      deck.off("fragmenthidden", handleFragmentHidden);
      deck.off("slidechanged", handleSlideChanged);
    };
  }, [deck, revealCounts, revealNotificationCount]);

  useEffect(() => {
    const cloud = cloudRef.current;

    if (!cloud) {
      return;
    }

    resetBubbles();
  }, [resetBubbles]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const syncSectionState = () => {
      const isPresent = section.classList.contains("present");

      if (!isPresent) {
        hasTriggeredRef.current = false;
        animationRef.current?.pause();
        visibleCountRef.current = INITIAL_NOTIFICATION_REVEAL_COUNT;
        setVisibleCount(INITIAL_NOTIFICATION_REVEAL_COUNT);
        return;
      }

      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        revealNotificationCount(visibleCountRef.current, {
          animateFromCurrent: false,
        });
        return;
      }
    };

    const observer = new MutationObserver(() => {
      syncSectionState();
    });
    observer.observe(section, { attributes: true, attributeFilter: ["class"] });
    syncSectionState();

    return () => {
      observer.disconnect();
      animationRef.current?.pause();
    };
  }, [revealNotificationCount]);

  return (
    <section ref={sectionRef} className={styles.notificationTypeScaleSlide}>
      <div className={styles.notificationTypeForeground}>
        <h2 aria-live="polite" className={styles.notificationTypeTitle}>
          What happens when you have {visibleCount} notification type{" "}
          {visibleCount === 1 ? "value" : "values"}?
        </h2>
      </div>
      <div ref={cloudRef} className={styles.notificationTypeCloud}>
        {uniqueTypes.map((type) => (
          <span key={type} className={styles.notificationTypeBubble}>
            {type}
          </span>
        ))}
      </div>
      {revealCounts.map((count) => (
        <span
          key={count}
          aria-hidden="true"
          className={`fragment custom ${styles.codeStepFragment}`}
          data-notification-type-count={count}
        />
      ))}
      <aside className="notes">
        <ul>
          <li>And as the application grew, we got more notification types.</li>
          <li>84 * 8 = 672.</li>
          <li>
            This isn't even accounting for individual user preferences. And with
            every new additional Side effect we want to trigger, we would have
            to update At least 84 different call sites.
          </li>
          <li>
            We want to make sure that our users get the notifications that they
            actually want, because if they end up turning notifications off, the
            app loses a lot of value.
          </li>
          <li>So we want to be really granular.</li>
          <li>
            We want to give our users as much control as possible so that they
            get the information that they need.
          </li>
        </ul>
      </aside>
    </section>
  );
}

function initializeExternalDocFrame(element: HTMLElement) {
  const existingIframe = element.querySelector("iframe");

  if (existingIframe) {
    return;
  }

  const rawConfig =
    element.innerHTML.trim().match(/<!--([\s\S]*?)-->/)?.[1] ?? "{}";
  let options: Record<string, unknown> = {};

  try {
    options = JSON.parse(rawConfig);
  } catch {
    options = {};
  }

  const src =
    typeof options.src === "string"
      ? options.src
      : "https://revealjs.com/react/";
  const title =
    typeof options.title === "string" ? options.title : "External reference";
  const allow =
    typeof options.allow === "string" ? options.allow : "fullscreen";

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

    const syncStep = (
      event: RevealEvent,
      direction: "forward" | "backward",
    ) => {
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
        <div
          data-id="event-bus-code-frame"
          className={`${styles.magicMoveFrame} ${styles.staticCodeFrame}`}
        >
          {isMounted ? (
            <ShikiMagicMovePrecompiled
              steps={steps}
              step={step}
              animate
              options={codeMorphOptions}
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
        <ul>
          <li>
            Not so bad. But not everyone has push notifications enabled, so we
            got to add an email.
          </li>
          <li>
            But not everyone has their email enabled, so we should probably add
            this to an app inbox as well.
          </li>
          <li>
            But when you&apos;re really active, the In-App inbox gets kind of
            noisy, so we should also probably mirror these important pick-up
            notifications in your chat with the person that you&apos;re going to
            pick up from.
          </li>
          <li>
            And then you probably need to measure this too with your analytics
            tool.
          </li>
          <li>
            Oh, and product, they want to get notified when someone purchases
            something or gets a bid accepted over $20.
          </li>
          <li>
            And while we&apos;re at it, let&apos;s also just have webhooks in
            here as well, because who knows if we&apos;re going to have to
            notify anyone else about this event.
          </li>
          <li>
            Oh, and you know, Product was thinking about having a live event get
            triggered here. I don&apos;t know why, but let&apos;s just do that
            too.
          </li>
        </ul>
      </aside>
    </section>
  );
}

function StaticHighlightedCodeBlock({
  className = "",
  steps,
}: {
  className?: string;
  steps: KeyedTokensInfo[];
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={`${styles.magicMoveFrame} ${styles.staticHighlightedCodeBlock} ${className}`}
    >
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

const eventBusTeachingMessages = [
  "A domain event constant gives the product event a stable string name.",
  "That domain event name becomes the key in the schema registry.",
  "That registry becomes the source of truth for the TypeScript payload map.",
  "The event name selects the payload type at compile time, then the same schema validates it at runtime.",
];

const preferenceGateMessages = [
  "The handler forwards the typed event payload to the notification template path.",
  "Resolve the notification payload, renders the template, and hands channels to the unified service.",
  "The preference service collapses global, notification-types into email/push booleans.",
  "Each channel asks the injected preference service before touching Expo or email.",
];

function EventBusTeachingMorphSlide({
  deck,
  steps,
}: {
  deck: RevealDeck | null;
  steps: KeyedTokensInfo[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const currentMessage =
    eventBusTeachingMessages[step] ?? eventBusTeachingMessages[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!deck || !sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const syncStep = (
      event: RevealEvent,
      direction: "forward" | "backward",
    ) => {
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
    <section
      ref={sectionRef}
      className={`${styles.centeredContentSlide} ${styles.eventBusTeachingSlide}`}
      data-auto-animate
      data-auto-animate-duration="0.7"
      data-auto-animate-easing="cubic-bezier(0.22, 1, 0.36, 1)"
      data-auto-animate-id="typed-event-bus-code"
    >
      <div className={styles.eventBusTeachingLayout}>
        <h2 className={styles.eventBusTeachingTitle}>Domain Events</h2>
        <div
          data-id="typed-event-bus-code-frame"
          className={`${styles.magicMoveFrame} ${styles.eventBusTeachingCode}`}
        >
          {isMounted ? (
            <ShikiMagicMovePrecompiled
              steps={steps}
              step={step}
              animate
              options={codeMorphOptions}
            />
          ) : (
            <div className={styles.magicMovePlaceholder} />
          )}
        </div>
        <p className={styles.eventBusTeachingCaption}>{currentMessage}</p>
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
        Let's go back to thinking about Redux and disjoint unions of types.
        <ul>
          <li>(morph1) We start out defining our event name.</li>
          <li>(morph2) We create our flux standard action event.</li>
          <li>
            (morph3) So what's really nice here is that with just a few short
            lines of TypeScript, we now have a mapped type.
          </li>
          <li>
            That can infer the key and specific payload of a notification
            emission that we would emit.
          </li>
          <li>So we have strongly-typed parameters.</li>
          <li>
            We know what notification we're sending to Expo Notification Service
            or Resend or anywhere, and we can pass around these types and use
            them throughout our application.
          </li>
          <li>And they fit really nicely into our event emitter.</li>
          <li>Because that's really where we want this strong type safety.</li>
          <li>
            (morph4) Our good friend, the parse function, as I alluded to
            earlier, playing a huge role here.
          </li>
        </ul>
      </aside>
    </section>
  );
}

function PayloadSchemaMorphSlide({ steps }: { steps: KeyedTokensInfo[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const previousStep = Math.max(0, steps.length - 2);
  const payloadStep = Math.max(0, steps.length - 1);
  const [step, setStep] = useState(previousStep);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    let animationFrame = 0;

    const syncSectionState = () => {
      window.cancelAnimationFrame(animationFrame);

      if (!section.classList.contains("present")) {
        setStep(previousStep);
        return;
      }

      setStep(previousStep);
      animationFrame = window.requestAnimationFrame(() => {
        setStep(payloadStep);
      });
    };

    const observer = new MutationObserver(syncSectionState);
    observer.observe(section, { attributes: true, attributeFilter: ["class"] });
    syncSectionState();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [payloadStep, previousStep]);

  return (
    <section
      ref={sectionRef}
      className={styles.centeredContentSlide}
      data-auto-animate
      data-auto-animate-duration="0.7"
      data-auto-animate-easing="cubic-bezier(0.22, 1, 0.36, 1)"
      data-auto-animate-id="typed-event-bus-code"
    >
      <div className={styles.eventBusTeachingLayout}>
        <div>
          <h2 className={styles.eventRegistryTitle}>The payload contract</h2>
        </div>
        <div
          data-id="typed-event-bus-code-frame"
          className={`${styles.magicMoveFrame} ${styles.eventBusTeachingCode} ${styles.payloadSchemaCode}`}
        >
          {isMounted ? (
            <ShikiMagicMovePrecompiled
              steps={steps}
              step={step}
              animate
              options={codeMorphOptions}
            />
          ) : (
            <div className={styles.magicMovePlaceholder} />
          )}
        </div>
      </div>
      <aside className="notes">
        <ul>
          <li>
            We want to be parsing our function arguments, and we want to really
            be explicit about what we're doing so that it's easy to follow, and
            it's easy to figure out what's going on when something breaks,
            either in Sentry or when we're building and we get a bunch of type
            errors.
          </li>
          <li>
            And then the final piece of the puzzle here, the contract of the
            payload that we're sending, is just another thought schema at the
            end of the day.
          </li>
        </ul>
      </aside>
    </section>
  );
}

function PreferenceGateMorphSlide({
  deck,
  steps,
}: {
  deck: RevealDeck | null;
  steps: KeyedTokensInfo[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const currentMessage =
    preferenceGateMessages[step] ?? preferenceGateMessages[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!deck || !sectionRef.current) {
      return;
    }

    const section = sectionRef.current;

    const syncStep = (
      event: RevealEvent,
      direction: "forward" | "backward",
    ) => {
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
    <section
      ref={sectionRef}
      className={styles.centeredContentSlide}
      data-auto-animate
      data-auto-animate-duration="0.7"
      data-auto-animate-easing="cubic-bezier(0.22, 1, 0.36, 1)"
      data-auto-animate-id="preference-gate-code"
    >
      <div className={styles.preferenceGateLayout}>
        <div className={styles.preferenceGateCopy}>
          <p className={styles.preferenceGateCaption}>{currentMessage}</p>
        </div>
        <div
          data-id="preference-gate-code-frame"
          className={`${styles.magicMoveFrame} ${styles.preferenceGateCode}`}
        >
          {isMounted ? (
            <ShikiMagicMovePrecompiled
              steps={steps}
              step={step}
              animate
              options={codeMorphOptions}
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
        <ul>
          <li>
            (morph1) The service fires the event after the action is taken.
          </li>
          <li>
            (morph2) The event handler passes the payload into the notification
            template.
          </li>
          <li>
            Before Expo or email gets called, we check whether this user wants
            this notification type, in this channel, and optionally for this
            group.
          </li>
          <li>The template builds the push and email payloads.</li>
        </ul>
      </aside>
    </section>
  );
}

export function PresentationDeck({
  codeMorphSteps,
  directSideEffectSteps,
  eventBusTeachingStep,
  eventEmitStep,
  notificationServiceSteps,
  preferenceGateSteps,
  sendPushPreferenceStep,
  snapshot,
}: {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
  eventBusTeachingStep: KeyedTokensInfo[];
  eventEmitStep: KeyedTokensInfo[];
  notificationServiceSteps: KeyedTokensInfo[];
  preferenceGateSteps: KeyedTokensInfo[];
  sendPushPreferenceStep: KeyedTokensInfo[];
  snapshot: TalkSnapshot;
}) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [deck, setDeck] = useState<RevealDeck | null>(null);
  const [plugins, setPlugins] = useState<DeckPlugin[] | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPlugins = async () => {
      const { default: RevealHighlight } =
        await import("reveal.js/plugin/highlight");
      const { default: RevealMermaid } =
        await import("reveal.js-mermaid-plugin/plugin/mermaid/mermaid.esm.js");

      if (isCancelled) {
        return;
      }

      setPlugins([
        Notes,
        RevealHighlight,
        RevealMermaid,
        createRevealAnythingPlugin(),
      ]);
    };

    void loadPlugins();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const initializeExternalDocs = () => {
      for (const element of Array.from(
        document.getElementsByClassName("external-doc"),
      )) {
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
      keyboard: true,
      keyboardCondition: null,
      mermaid: {
        securityLevel: "strict",
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          darkMode: false,
          fontFamily: "IBM Plex Mono, SFMono-Regular, Menlo, monospace",
          lineColor: "#0066cc",
          primaryColor: "#eaf3ff",
          primaryTextColor: "#000000",
          tertiaryColor: "#f5f5f7",
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
          I just wanted to thank a software mansion for having me come. I'm so
          grateful for the opportunity to speak at App.js Conf 2026. It's an
          honor to be here.
        </aside>
      </section>

      <section>
        <div className={styles.introLayout}>
          <div>
            <h2 className={styles.bigIdea}>Hi, I&apos;m Ben</h2>
            <p className={styles.statement}>
              I&apos;m the founder of Treasure It, a marketplace for P2P
              hyperlocal commerce
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
        <aside className="notes">
          <ul>
            <li>
              I created Treasure It, which is a platform for local commerce.
            </li>
            <li>
              So if you've ever bought anything off of Facebook Marketplace or
              Craigslist, and wanted to throw your computer at a wall because of
              how difficult it is.
            </li>
            <li>
              Coordination and scheduling have always been the Achilles' heel.
              Getting the thing down the street is harder than getting it from a
              warehouse across the country.
            </li>
            <li>I want to solve that.</li>
          </ul>
        </aside>
      </section>

      <section>
        <div className={styles.marketplaceNotificationLayout}>
          <div>
            <h2 className={styles.bigIdea}>Notifications take center stage</h2>
          </div>
          <Image
            alt="Marketplace notifications connecting store, calendar, and package activity"
            className={styles.marketplaceNotificationImage}
            priority
            sizes="34rem"
            src={notificationIllustration}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              We solved it with built-in scheduling platform and inventory
              management system.
            </li>
            <li>
              The act of "shipping" is a lot more involved than just sending it
              to the post office.
            </li>
            <li>
              The user needs to get the right notification at the right time, to
              make sure they're at the right place at the right time with the
              right thing.
            </li>
            <li>
              That level of IRL coordination makes notifications a first-class
              product on their own.
            </li>
            <li>If we can't provide effective coordination, we're useless.</li>
            <li>My job is to make it painfully hard to miss a pickup.</li>
            <li>
              Expo Push Notification Service has been integral in achieving our
              mission.
            </li>
          </ul>
        </aside>
      </section>

      <section className={styles.notificationFailureSlide}>
        <Image
          alt="Notification bell crossed out"
          className={styles.notificationFailureImage}
          sizes="38rem"
          src={notificationOffImage}
        />
        <p className={styles.notificationFailureText}>failure</p>
      </section>

      <section className={styles.centeredContentSlide}>
        <Image
          alt="Expo Notifications documentation page"
          className={styles.expoDocsImage}
          priority
          sizes="86rem"
          src={expoDocsHomepageImage}
        />
        <aside className="notes">
          <ul>
            <li>
              I think most of us here have been on This page of the expo docs.
            </li>
            <li>
              When I was reading the request for proposals, the only requirement
              was using an Expo service, and I said, I bet I could sneak a
              backend talk into a React Native conference.
            </li>
            <li>
              But, in all seriousness, The documentation, product, And developer
              experience of Expo Push Notifications has been incredible, And I'm
              so happy that it exists.
            </li>
          </ul>
        </aside>
      </section>

      <NotificationTypeCloudSection deck={deck} types={notificationTypes} />

      <section className={styles.centeredContentSlide}>
        <h2
          className={`${styles.fullWidthPunchline} ${styles.oversizedMetric}`}
        >
          672
        </h2>
      </section>

      <section className={styles.centeredContentSlide}>
        <Image
          alt="iOS Notification Center with multiple app notifications"
          className={styles.notificationCenterImage}
          sizes="42rem"
          src={notificationCenterImage}
        />
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          In-app notifications?
        </h2>
        <aside className="notes">
          But sometimes people's phones have a lot of notifications, and it's
          easy for them to just check the in-app notifications tab. Because we
          really don't want our users to miss important notifications
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <Image
          alt="Treasure It in-app notifications inbox"
          className={styles.notificationCenterImage}
          sizes="42rem"
          src={inAppNotificationsImage}
        />
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.chatNotificationLayout}>
          <h2 className={styles.chatNotificationTitle}>System Messages</h2>
          <Image
            alt="Treasure It in-chat notification timeline"
            className={styles.chatNotificationImage}
            sizes="32rem"
            src={mirroredChatImage}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              Then, as one does, you become a power user of your own app, and
              you realize that your in-app notifications are just a mess.
            </li>
            <li>
              There's so much going on between 10 different people coordinating
              like six different pickups that you're still missing the signal
              from the noise.
            </li>
            <li>
              To solve this, mirror these notifications as a system message in
              line with the user that you're chatting with to make the exchange
              with.
            </li>
            <li>
              It becomes even harder to forget what happened or when you're
              supposed to be somewhere.
            </li>
          </ul>
        </aside>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          What happens when you need to derive multiple notifications from a
          single event?
        </h2>
        <aside className="notes">
          We end up with notifications that have been derived from another
          event. This system needs to be composable so that If we need to derive
          notifications from existing ones, we can do that without repeating
          ourselves.
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <MermaidBlock
          chart={`flowchart LR
    A["recipient.switched"] --> B["removed_recipient<br/>old recipient"]
    A --> C["chosen<br/>new recipient"]`}
          className={styles.derivedNotificationDiagram}
        />
        <aside className="notes">
          An example of this kind of derived event is going to be when you
          switch a recipient.
          <ul>
            <li>
              Let's say you're trying to get something out the door and someone
              hasn't replied to you.
            </li>
            <li>
              They are MIA, AWOL; you don't hear from them, and there's someone
              else who wants to take it.
            </li>
            <li>
              You need to tell the person that's unresponsive that they are no
              longer chosen, and you want to let the new recipient know That
              they've been chosen and they need to schedule a pickup time.
            </li>
            <li>You'd be surprised how often this kind of thing happens.</li>
          </ul>
        </aside>
      </section>
      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          Oh, and some notifications are only for premium users
        </h2>
        <aside className="notes">
          And we have additional notifications that are only for premium users
          because, Business and numbers.
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.pmAnalyticsLayout}>
          <h2 className={styles.pmAnalyticsTitle}>
            Your product manager needs this in analytics and purchases above $20
            auto-posted on Slack
          </h2>
          <Image
            alt="Product manager dog with roadmap notes and notification demands"
            className={styles.pmAnalyticsImage}
            sizes="32rem"
            src={moosePmImage}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              If we're dealing with one side effect and one external system, we
              should be able to effectively communicate with any external
              system.
            </li>
            <li>
              And then what happens the next time You Are given another
              requirement for another side effect.
            </li>
            <li>
              There has to be a better way than updating 84 different call
              sites.
            </li>
            <li>So, how do we solve this problem?</li>
            <li>Calmly and thoughtfully,</li>
          </ul>
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

      <section className={styles.centeredContentSlide}>
        <div className={styles.preferencesLayout}>
          <h2 className={styles.preferencesTitle}>
            Don't forget about your users' preferences
          </h2>
          <Image
            alt="Treasure It notification preferences screen"
            className={styles.preferencesImage}
            sizes="30rem"
            src={preferencesImage}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              Users kept telling me over and over again that the platforms today
              will send you messages that are just noise and spam.
            </li>
            <li>
              And we need to make sure that our users can configure
              notifications to their heart's desire, that they are in full
              control, and they'll get the messages that they need.
            </li>
            <li>Nothing more, nothing less.</li>
          </ul>
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.cornerCryLayout}>
          <div>
            <h2 className={styles.bigIdea}>Go in the corner and cry</h2>
          </div>
          <Image
            alt="Crying reaction to notification scale"
            className={styles.cornerCryImage}
            sizes="30rem"
            src={cryingImage}
          />
        </div>
        <aside className="notes">
          Go to the corner and start crying. And in that moment of panic and
          desperation, the first thing you start to think of is of course.....
        </aside>
      </section>
      <section className={styles.centeredContentSlide}>
        <div className={styles.eventOrbitDiagramLayout}>
          <h2 className={styles.eventOrbitDiagramTitle}>
            Put the event in the center
          </h2>
          <MermaidBlock
            chart={`flowchart LR
    Push[Push] --- Event((Domain event))
    Email[Email] --- Event
    Chat[Chat] --- Event
    Event --- Inbox[In-app]
    Event --- Analytics[Analytics]
    Event --- Slack[Slack]

    classDef event fill:#fff3e0,color:#000000,stroke:#0066cc,stroke-width:3px
    classDef channel fill:#e8f5e8,color:#000000,stroke:#86efac
    classDef external fill:#fce4ec,color:#000000,stroke:#f9a8d4

    class Event event
    class Push,Email,Inbox,Chat channel
    class Analytics,Slack external`}
            className={styles.eventOrbitMermaidDiagram}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              The product code emits the event once, and everything else
              subscribes from the outside.
            </li>
            <li>
              Push, email, analytics, and Slack are no longer hard-coded into
              the product call site.
            </li>
            <li>
              Adding a new side effect becomes adding a new subscriber, not
              updating 84 different places.
            </li>
          </ul>
        </aside>
      </section>

      <section>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://redux.js.org/introduction/why-rtk-is-redux-today#what-does-the-redux-core-do"
          title="Redux core docs"
        />
        <aside className="notes">
          Redux! That's it, that's the solution. That's how we're solving all of
          our problems. One thing that I really loved about Redux was how
          explicit the action creators were.
        </aside>
      </section>

      <section>
        <h2 className={styles.reduxDocTitle}>
          What about actions and action creators?
        </h2>
        <ExternalDocFrame
          className={styles.reduxDocFrame}
          src="https://redux.js.org/usage/reducing-boilerplate#generating-action-creators"
          title="Redux action creators docs"
        />
        <aside className="notes">
          <ul>
            <li>
              Just those beefy all-caps constants telling you exactly what's
              happening every single time?
            </li>
            <li>
              Made it easy to grab my codebase, made it easy to understand what
              piece of state was being updated, and yeah, incredibly
              straightforward and easy to reason about.
            </li>
            <li>But more specifically, action creators</li>
          </ul>
        </aside>
      </section>

      <section>
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
        <aside className="notes">
          And more specifically than that, thinking about the flux standard
          action. These all feel like events that are being broadcast and
          subscribed to. Which they were
        </aside>
      </section>

      <section className={styles.domainDrivenDesignSlide}>
        <h2 className={styles.reduxDocTitle}>Domain-Driven Design</h2>
        <Image
          alt="Domain-Driven Design book cover"
          className={styles.dddCoverImage}
          sizes="24rem"
          src={domainDrivenDesignImage}
        />
        <aside className="notes">
          Sitting in the corner, I start thinking about this book, Domain-Driven
          Design. It was published back in 2003. The key idea is that you should
          be able to model your domain in a way that is easy to understand and
          easy to reason about.
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <h2 className={styles.eventEmitterTitle}>EventEmitter3</h2>
        <div className={styles.eventEmitterLayout}>
          <pre className={styles.eventEmitterCode}>
            <code className="language-js">{`


const eventBus = new EventEmitter();


eventBus.on("item.bid.received", notifySeller);
eventBus.on("item.bid.received", mirrorIntoChat);
eventBus.on("item.bid.received", trackAnalytics);


eventBus.emit("item.bid.received", payload);`}</code>
          </pre>
        </div>
        <aside className="notes">
          <ul>
            <li>
              And then how are these different systems are going to connect
              outside of their boundaries without coupling them together?
            </li>
            <li>
              We don't have a dispatch and an action creator here in our
              backend, but we do have events, like nodejs events, but also we
              ended up using event emitter three
            </li>
          </ul>
        </aside>
      </section>

      <section>
        <p className={styles.eyebrow}>Then the guarantee</p>
        <h2 className={styles.reduxDocTitle}>Type-Driven Design</h2>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/"
          title="Parse, don't validate"
        />
        <aside className="notes">
          <ul>
            <li>
              Yeah, so now I realize that I should probably just keep sitting in
              this corner because I'm getting a lot of good ideas here.
            </li>
            <li>
              And I remember reading this blog post about seven years ago.
            </li>
            <li>Wow, 2019.</li>
            <li>But this blog post was heavily referenced in the Zod docs.</li>
            <li>And I don't personally write Haskell.</li>
            <li>
              But incredible read, and yeah, functional programming is cool.
            </li>
          </ul>
        </aside>
      </section>

      <section>
        <p className={styles.eyebrow}>And a schema</p>
        <h2 className={styles.reduxDocTitle}>Parse don't validate</h2>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://zod.dev/basics?id=parsing-data#parsing-data"
          title="Zod docs"
        />
        <aside className="notes">
          <ul>
            <li>
              And the parse method that is literally the first method in the
              docs.
            </li>
            <li>
              And this parse method becomes integral, really the bedrock of this
              system.
            </li>
            <li>
              And is able to provide us with a level of type safety that I
              couldn't get before.
            </li>
            <li>
              Something close to an introspection layer that you would get from
              a GraphQL schema.
            </li>
            <li>
              Being able to get those red squiggly lines and trust that you
              actually have a real type error in a large system becomes worth
              its weight in gold.
            </li>
          </ul>
        </aside>
      </section>
      <section className={styles.fullBleedImageSlide}>
        <Image
          alt="Salt Bae sprinkling TypeScript"
          className={styles.fullBleedMemeImage}
          priority
          sizes="100vw"
          src={saltBaeTypescriptImage}
        />
        <aside className="notes">
          And yeah, just think about types like map types and inferring types
          and all the types, because TypeScript rules. Yeah, I have all these
          ideas in my head, and my next thought is....
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <h2 className={styles.fullWidthPunchline}>Just steal their ideas.</h2>
        <aside className="notes">
          These ideas are great, and if I'm not going to steal them, someone
          else will.
        </aside>
      </section>

      <section>
        <Image
          alt="Venn diagram showing Flux Actions, Event Bus, and Domain Events overlapping into a new idea"
          className={styles.vennImage}
          priority
          sizes="78rem"
          src={vennDiagramImage}
        />
        <aside className="notes">
          Eventually when you steal enough ideas, you get to call it a new idea.
          God, I love a good Venn diagram. Especially when three overlapping
          parts aren't labeled because, Corporate strategy.
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.provenTechnologyLayout}>
          <h2 className={styles.provenTechnologyTitle}>
            Why use a proven Technology?
          </h2>
          <div className={styles.provenTechnologyLogos}>
            <Image
              alt="OneSignal logo"
              className={styles.provenTechnologyLogo}
              sizes="28rem"
              src={oneSignalLogoImage}
            />
            <Image
              alt="Knock logo"
              className={styles.provenTechnologyLogo}
              sizes="28rem"
              src={knockLogoImage}
            />
          </div>
        </div>
        <aside className="notes">
          And there are a lot of companies that do this and a whole slew of
          other things extremely well, but, Where's the fun in that?
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.solutionDiagramLayout}>
          <MermaidBlock
            chart={`graph TB
    Service[Domain service] --> EventBus[Typed Event Bus]
    EventBus --> Handler[Notification handler]

    Handler --> Unified[Unified notification service]
    Unified --> Prefs[Preference and group checks]
    Prefs --> Push[Push delivery]
    Prefs --> Email[Email queue with fallback]

    Unified --> Ledger[Notification ledger]
    Ledger --> Inbox[In-app inbox reads]

    Handler --> ChatMirror[Chat mirror path]
    ChatMirror --> Timeline[ChatTimelineService.addSystemMessage]

    Handler --> Analytics[Analytics event]
    Handler --> Slack[Slack webhook]

    Push --> Expo[Expo push API]
    Email --> Provider[Email provider]

    classDef userLayer fill:#e1f5fe,color:#000000,stroke:#7dd3fc
    classDef eventLayer fill:#fff3e0,color:#000000,stroke:#0066cc
    classDef notifyLayer fill:#e8f5e8,color:#000000,stroke:#86efac
    classDef storageLayer fill:#f1f8e9,color:#000000,stroke:#bef264
    classDef extLayer fill:#fce4ec,color:#000000,stroke:#f9a8d4

    class Service userLayer
    class EventBus,Handler eventLayer
    class Unified,Prefs,Push,Email,ChatMirror,Timeline,Analytics,Slack notifyLayer
    class Ledger,Inbox storageLayer
    class Expo,Provider extLayer`}
            className={styles.solutionMermaidDiagram}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              And it's really not so bad once we start to break down the system
              a little more and figure out what our requirements are.
            </li>
            <li>Our event bus publishes to a notification handler.</li>
            <li>Or really any subscriber.</li>
            <li>
              That way we can decouple our business logic And services from our
              side effects.
            </li>
            <li>
              And then from there we can Pass our event to any number of our
              services that handle our side effects, but most importantly, our
              notifications.
            </li>
            <li>Those are the ones that we deeply care about the most.</li>
          </ul>
        </aside>
      </section>

      <EventBusTeachingMorphSlide
        deck={deck}
        steps={eventBusTeachingStep.slice(0, 4)}
      />
      <PayloadSchemaMorphSlide steps={eventBusTeachingStep} />
      <PreferenceGateMorphSlide deck={deck} steps={preferenceGateSteps} />
      <section className={styles.centeredContentSlide}>
        <div>
          <p className={styles.statement}>
            The event name owns the payload shape, the runtime validation, and
            the TypeScript type every subscriber sees.
          </p>
        </div>
        <aside className="notes">
          So yeah, similar to Redux, that event name, that constant, that's
          owning the entire life cycle of the event emission that we're firing
          off
        </aside>
      </section>
      <section>
        <Image
          alt="Standard action code showing commerce activation buyer match credit request"
          className={styles.standardActionImage}
          priority
          sizes="104rem"
          src={standardActionImage}
        />
        <aside className="notes">The type inference.</aside>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={styles.sectionTitle}>
          And now all of our work finally pays off
        </h2>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={styles.sectionTitle}>A beautiful red squiggle</h2>
        <Image
          alt="TypeScript error on event payload showing an unexpected brandName field"
          className={styles.errorEventPayloadImage}
          priority
          sizes="78rem"
          src={errorEventPayloadImage}
        />
        <aside className="notes">
          <ul>
            <li>The moment we've been waiting for: the humble red squiggle</li>
            <li>
              Having strong type safety especially in A large system is worth
              its weight in gold. Giving both myself and my AI coding agent
              granular errors that are easy to trace and resolve.
            </li>
          </ul>
        </aside>
      </section>
      <CodeMorphSlide
        deck={deck}
        frameDataId="notification-service-code-frame"
        fragmentSteps={[1, 2, 3, 4, 5]}
        initialStep={0}
        layout="hero"
        steps={notificationServiceSteps}
        subtitle=""
        title="Dependency injection"
      />
      {/* <section className={styles.centeredContentSlide}>
        <div className={styles.notificationLifecycleLayout}>
          <MermaidBlock
            chart={`flowchart LR
    Action[Show interest] --> Service[Interest service]
    Service --> Event[item.interest_added]
    Event --> Bus[TypedEventBus<br/>parse schema]
    Bus --> Type[interest_shown<br/>preference key]
    Type --> Template[Template<br/>copy + link]
    Template --> Unified[NotificationService.send]
    Unified --> Prefs{Prefs allow?}

    Prefs -- yes --> Delivery[Push / email]
    Prefs -- no --> Skip[Skip + log]
    Unified --> Ledger[Ledger<br/>in-app history]

    classDef product fill:#e1f5fe,color:#000000,stroke:#7dd3fc
    classDef event fill:#fff3e0,color:#000000,stroke:#0066cc
    classDef policy fill:#e8f5e8,color:#000000,stroke:#86efac
    classDef delivery fill:#fce4ec,color:#000000,stroke:#f9a8d4
    classDef storage fill:#f1f8e9,color:#000000,stroke:#bef264

    class Action,Service product
    class Event,Bus,Type event
    class Template,Unified,Prefs policy
    class Delivery,Skip delivery
    class Ledger storage`}
            className={styles.notificationLifecycleDiagram}
          />
        </div>
        <aside className="notes">
          <ul>
            <li>This is the whole thing at a high level.</li>
            <li>The product service owns the fact that interest was shown.</li>
            <li>The domain event is item.interest_added.</li>
            <li>
              The notification type is interest_shown, which is the template and
              preference key.
            </li>
            <li>
              The handler bridges those two ideas, and the unified notification
              service owns the delivery policy.
            </li>
            <li>
              The important operational point is that the product write is
              already done when the event is emitted.
            </li>
            <li>Notification failures are reported separately.</li>
          </ul>
        </aside>
      </section> */}

      <section className={styles.centeredContentSlide}>
        <div className={styles.providerInjectionLayout}>
          <h2 className={styles.providerInjectionTitle}>
            The service only knows the contract
          </h2>
          <Image
            src={notificationServiceProvidersImage}
            alt="NotificationService receives push, email, user preferences, and notification ledger providers"
            className={styles.providerInjectionImage}
            sizes="(min-width: 1200px) 80rem, 92vw"
          />
        </div>
        <aside className="notes">
          <ul>
            <li>
              Push, email, preferences, and ledger are providers that get passed
              in.
            </li>
            <li>The service only needs a method it can call.</li>
            <li>
              That keeps channel implementation details outside the
              orchestration code.
            </li>
          </ul>
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <StaticHighlightedCodeBlock
          className={styles.sendPushPreferenceCode}
          steps={sendPushPreferenceStep}
        />
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.notificationLoopLayout}>
          <h2 className={styles.notificationLoopTitle}>The loop closes</h2>
          <MermaidBlock
            chart={`flowchart LR
    User((User)) --> BusinessLogic((Business<br/>logic))
    BusinessLogic --> Event((Event))
    Event --> Handler((Handler))
    Handler --> Service((Service<br/>with DI))
    Service --> User

    classDef user fill:#e1f5fe,color:#000000,stroke:#7dd3fc,stroke-width:3px
    classDef business fill:#fef3c7,color:#000000,stroke:#fbbf24,stroke-width:3px
    classDef event fill:#fff3e0,color:#000000,stroke:#0066cc,stroke-width:3px
    classDef handler fill:#f3e8ff,color:#000000,stroke:#c084fc,stroke-width:3px
    classDef service fill:#e8f5e8,color:#000000,stroke:#86efac,stroke-width:3px

    class User user
    class BusinessLogic business
    class Event event
    class Handler handler
    class Service service`}
            className={styles.notificationLoopDiagram}
          />
        </div>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.cellCaseLayout}>
          <h2 className={styles.cellCaseTitle}>
            And that&apos;s how I got this cell phone case
          </h2>
          <Image
            src={cellCaseImage}
            alt="Pink cell phone case on a wooden table"
            className={styles.cellCaseImage}
            sizes="(min-width: 1200px) 36rem, 72vw"
          />
        </div>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.thankYouLayout}>
          <h2 className={styles.thankYouTitle}>Thank you</h2>
          <Image
            src={jebThankYouImage}
            alt="Jeb Bush saying thank you"
            className={styles.thankYouImage}
            unoptimized
          />
        </div>
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
    <Deck config={revealConfig} onReady={handleReady} plugins={plugins}>
      {slides}
    </Deck>
  );
}
