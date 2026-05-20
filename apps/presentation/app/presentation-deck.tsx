"use client";

import { Deck } from "@revealjs/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
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
import knockLogoImage from "./knocklogo.png";
import oneSignalLogoImage from "./onesignal.png";
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

const CLOUD_ANIMATION_DURATION = 1100;

function NotificationTypeCloudSection({ types }: { types: string[] }) {
  const uniqueTypes = useMemo(() => Array.from(new Set(types)), [types]);
  const sectionRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
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

      child.style.opacity = "0";
      child.style.transform =
        "translate3d(0px, 36px, -180px) rotateX(8deg) rotateY(2deg) scale(0.68)";
      child.style.filter = "blur(8px)";
    }
  }, []);

  const launchAnimation = useCallback(() => {
    const cloud = cloudRef.current;

    if (!cloud) {
      return;
    }

    const bubbles = Array.from(cloud.children).filter(
      (child): child is HTMLSpanElement => child instanceof HTMLSpanElement,
    );

    animationRef.current = animate(bubbles, {
      autoplay: false,
      duration: CLOUD_ANIMATION_DURATION,
      delay: 20,
      easing: "out-cubic",
      opacity: [0, 1],
      translateY: [36, 0],
      translateZ: [-180, 0],
      rotateX: [8, 0],
      rotateY: [2, 0],
      scale: [0.68, 1],
      filter: ["blur(8px)", "blur(0px)"],
    });

    const hfAnimeHost = window as Window & { __hfAnime?: ReturnType<typeof animate>[] };
    hfAnimeHost.__hfAnime = hfAnimeHost.__hfAnime || [];
    hfAnimeHost.__hfAnime.push(animationRef.current);

    animationRef.current.pause();
    animationRef.current.seek(0);
    animationRef.current.play();
  }, []);

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
        return;
      }

      if (!hasTriggeredRef.current) {
        resetBubbles();
        hasTriggeredRef.current = true;
        launchAnimation();
        return;
      }

      resetBubbles();
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
  }, [launchAnimation, resetBubbles]);

  return (
    <section ref={sectionRef} className={styles.notificationTypeScaleSlide}>
      <div className={styles.notificationTypeForeground}>
        <h2 className={styles.notificationTypeTitle}>
          What happens when you have 84 notification type values?
        </h2>
      </div>
      <div ref={cloudRef} className={styles.notificationTypeCloud}>
        {uniqueTypes.map((type, index) => (
          <span key={`${type}-${index}`} className={styles.notificationTypeBubble}>
            {type}
          </span>
        ))}
      </div>
      <aside className="notes">
      And as the application grew, we got more notification types. In staying true to our mission, we want to make sure that our users get the notifications that they actually want, because if they end up turning notifications off, the app loses a lot of value. So we want to be really granular. We want to give our users as much control as possible so that they get the information that they need to successfully transact in person and in their communities. And each one of these types represents a different action that the system takes in that journey from initial bid to I'm here at the pick up location, and most importantly, everything that can happen in between.
      </aside>
    </section>
  );
}

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
          <p className={styles.eyebrow}>V0</p>
          <h2 className={styles.sectionTitle}>How it started</h2>
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
        <p>
          You start with your business logic. A user does a thing. Update our
          database. And great. Problem solved. Right, but we&apos;re going to
          need a notification. Alright,
        </p>
        <ul>
          <li>Not so bad. But not everyone has push notifications enabled, so we got to add an email.</li>
          <li>But not everyone has their email enabled, so we should probably add this to an app inbox as well.</li>
          <li>But when you&apos;re really active, the In-App inbox gets kind of noisy, so we should also probably mirror these important pick-up notifications in your chat with the person that you&apos;re going to pick up from.</li>
          <li>And then you probably need to measure this too with your analytics tool.</li>
          <li>Oh, and product, they want to get notified when someone purchases something or gets a bid accepted over $20.</li>
          <li>And while we&apos;re at it, let&apos;s also just have webhooks in here as well, because who knows if we&apos;re going to have to notify anyone else about this event.</li>
          <li>Oh, and you know, Product was thinking about having a live event get triggered here. I don&apos;t know why, but let&apos;s just do that too.</li>
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
    <div className={`${styles.magicMoveFrame} ${styles.staticHighlightedCodeBlock} ${className}`}>
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
  "A domain event name starts in the schema registry.",
  "That registry becomes the source of truth for the TypeScript payload map.",
  "The event name selects the payload type at compile time, then the same schema validates it at runtime.",
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
  const currentMessage = eventBusTeachingMessages[step] ?? eventBusTeachingMessages[0];

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
    <section
      ref={sectionRef}
      className={styles.centeredContentSlide}
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
              options={{
                duration: 650,
                lineNumbers: true,
                stagger: 0.16,
              }}
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
        Press forward through the morph: first show the domain event registry,
        then the inferred DomainEvents map, then land on the typed emit method.
        The point is that the event name owns both the compile-time payload and
        runtime validation.
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
          <p className={styles.eyebrow}>Payload schema</p>
          <h2 className={styles.eventRegistryTitle}>
            The payload contract is a Zod schema.
          </h2>
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
              options={{
                duration: 650,
                lineNumbers: true,
                stagger: 0.16,
              }}
            />
          ) : (
            <div className={styles.magicMovePlaceholder} />
          )}
        </div>
      </div>
    </section>
  );
}

export function PresentationDeck({
  codeMorphSteps,
  directSideEffectSteps,
  eventBusTeachingStep,
  eventRegistryStep,
  eventEmitStep,
  notificationServiceSteps,
  snapshot,
}: {
  codeMorphSteps: KeyedTokensInfo[];
  directSideEffectSteps: KeyedTokensInfo[];
  eventBusTeachingStep: KeyedTokensInfo[];
  eventRegistryStep: KeyedTokensInfo[];
  eventEmitStep: KeyedTokensInfo[];
  notificationServiceSteps: KeyedTokensInfo[];
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
      keyboard: true,
      keyboardCondition: null,
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
        I just wanted to thank a software mansion for having me come. I'm so grateful for the opportunity to speak at App.js Conf 2026. It's an honor to be here.
        </aside>
      </section>

      <section>
        <div className={styles.introLayout}>
          <div>
            <p className={styles.eyebrow}>Intro</p>
            <h2 className={styles.bigIdea}>Hi, I&apos;m Ben.</h2>
            <p className={styles.statement}>
              I&apos;m the founder of Treasure It, a marketplace for P2P hyperlocal commerce
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
        I created Treasure It, which is a platform for local commerce. So if you've ever bought anything off of Facebook Marketplace or Craigslist, And wanted to throw your computer at a wall because of how difficult it is. I want to solve that.
        </aside>
      </section>

      <section>
        <div className={styles.marketplaceNotificationLayout}>
          <div>
            <p className={styles.eyebrow}>Marketplace reality</p>
            <h2 className={styles.bigIdea}>
              Notifications take center stage
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
        <aside className="notes">
        So, how do we fix the problem?


        We solved it with built-in scheduling platform and inventory management system.

        Because our users are interacting peer-to-peer, The act of "shipping" is a key part of the product. Making sure that the user gets the right notification at the right time for the right item to make sure that they end up at the right place It is what makes the product useful.

        And that's why notifications have taken such a front-row seat in my journey. If a buyer and seller can't meet at the right time and find the right price, the product is useless. My job is to make it painfully hard to miss a pickup. Expo Push Notification Service has been integral in achieving our mission.

        </aside>
      </section>

      <section>
        <p className={styles.eyebrow}>The story begins here</p>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://docs.expo.dev/versions/latest/sdk/notifications/"
          title="Expo Notifications docs"
        />
        <aside className="notes">
        I think most of us here have been on This page of the expo docs. When I was reading the request for proposals, the only requirement was using an Expo service, and I said, I bet I could sneak a backend talk into a React Native conference. But, in all seriousness, The documentation, product, And developer experience of Expo Push Notifications has been incredible, And I'm so happy that it exists.
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

      <NotificationTypeCloudSection types={notificationTypes} />

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          What happens when you need to derive multiple notifications from a single event?
        </h2>
        <aside className="notes">
        Sometimes, We end up with notifications that have been derived from another event. So we need this system to be composable so that If we need to drive notifications from existing ones, we can do that without repeating ourselves.
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <p className={styles.eyebrow}>Derived notifications</p>
        <MermaidBlock
          chart={`flowchart LR
    A["recipient.switched"] --> B["removed_recipient<br/>old recipient"]
    A --> C["chosen<br/>new recipient"]`}
          className={styles.derivedNotificationDiagram}
        />
        <aside className="notes">
        The most straightforward example of this kind of derived event is going to be when you switch a recipient. So let's say you're trying to get something out the door and someone hasn't replied to you. They are MIA, AWOL; you don't hear from them, and there's someone else who wants to take it. You need to tell the person that's unresponsive that they are no longer chosen, and you want to let the new recipient know That they've been chosen and they need to schedule a pickup time. You'd be surprised how often this kind of thing happens.
        </aside>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          What happens when you need to support in-app notifications?
        </h2>
        <aside className="notes">
        But sometimes people's phones have a lot of notifications, and it's easy for them to just check the in-app notifications tab. Because we really don't want our users to miss important notifications
        </aside>
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
        <aside className="notes">
        Then, as one does, you become a power user of your own app, and you realize that your in-app notifications are just a mess. There's so much going on between 10 different people coordinating like six different pickups that you're still missing the signal from the noise. So I decided to mirror these notifications as a system message in line with the user that you're chatting with to make the exchange with. That way, it becomes even harder to forget what happened or when you're supposed to be somewhere.
        </aside>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={`${styles.sectionTitle} ${styles.wideQuestionTitle}`}>
          Oh, and some notifications are only for premium users.
        </h2>
        <aside className="notes">
        And we have additional notifications that are only for premium users because, Business and numbers.
        </aside>
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
        <aside className="notes">
        Users kept telling me over and over again that the platforms today will send you messages that are just noise and spam. And we need to make sure that our users can configure notifications to their heart's desire, that they are in full control, and they'll get the messages that they need. Nothing more, nothing less.
        </aside>
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
        <aside className="notes">
        So I do have a coworker who's a pretty no-nonsense product manager. He thinks that all of this should have been done yesterday and you know, just get AI to do it. That's it, it will be fine. He's also convinced that I didn't feed him dinner five minutes ago and that he's starving. But also, you're going to want to know what's happening in the app. Maybe you want to see when a specific kind of purchase is made or when someone keeps dropping out or a pickup was completed. If we're dealing with one side effect and one external system, we should be able to effectively communicate with any external system using the same framework that we're building for our notifications. So, how do we solve this problem? Calmly and thoughtfully,
        </aside>
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
        <aside className="notes">
        Go to the corner and start crying. And in that moment of panic and desperation, the first thing you start to think of is of course.....
        </aside>
      </section>

      <section>
        <p className={styles.eyebrow}>I Started thinking about Redux</p>
        <ExternalDocFrame
          className={styles.storyDocFrame}
          src="https://redux.js.org/introduction/why-rtk-is-redux-today#what-does-the-redux-core-do"
          title="Redux core docs"
        />
        <aside className="notes">
        Redux! That's it, that's the solution. That's how we're solving all of our problems. One thing that I really loved about Redux was how explicit the action creators were.
        </aside>
      </section>

      <section>
        <p className={styles.eyebrow}>Then I started thinking</p>
        <h2 className={styles.reduxDocTitle}>What about actions and action creators?</h2>
        <ExternalDocFrame
          className={styles.reduxDocFrame}
          src="https://redux.js.org/usage/reducing-boilerplate#generating-action-creators"
          title="Redux action creators docs"
        />
        <aside className="notes">
        Just those beefy all-caps constants telling you exactly what's happening every single time? Made it easy to grab my codebase, made it easy to understand what piece of state was being updated, and yeah, incredibly straightforward and easy to reason about. But more specifically, action creators
        </aside>
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
        <aside className="notes">
        And more specifically than that, thinking about the flux standard action. These all feel like events that are being broadcast and subscribed to. Which they were
        </aside>
      </section>

      <section>
        <h2 className={styles.reduxDocTitle}>Domain-Driven Design</h2>
        <Image
          alt="Domain-Driven Design book cover"
          className={styles.dddCoverImage}
          sizes="24rem"
          src={domainDrivenDesignImage}
        />
        <aside className="notes">
        Sitting in the corner, I start thinking about this book, Domain-Driven Design. It was published back in 2003.

        Domain-driven design is predicated on the following goals:

        - initiating a creative collaboration between technical and domain experts to iteratively refine a conceptual model that addresses particular domain problems.
        - basing complex designs on a model of the domain;
        - placing the project's primary focus on the core domain and domain logic layer;

        And the key idea is that you should be able to model your domain in a way that is easy to understand and easy to reason about.

        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
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
        <aside className="notes">
        And then how are these different systems are going to connect outside of their boundaries without coupling them together? We don't have a dispatch and an action creator here in our backend, but we do have events, like nodejs events, but also we ended up using event emitter three
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
        Yeah, so now I realize that I should probably just keep sitting in this corner because I'm getting a lot of good ideas here. And I remember reading this blog post about seven years ago. Wow, 2019. But this blog post was heavily referenced in the Zod docs. And I don't personally write Haskell. But incredible read, and yeah, functional programming is cool.
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
        And the parse method that is literally the first method in the docs. And this parse method becomes integral, really the bedrock of this system. And is able to provide us with a level of type safety that I couldn't get before. Something close to an introspection layer that you would get from a GraphQL schema. Being able to get those red squiggly lines and trust that you actually have a real type error in a large system becomes worth its weight in gold.
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
        And yeah, just think about types like map types and inferring types and all the types, because TypeScript rules. Yeah, I have all these ideas in my head, and my next thought is....
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <h2 className={styles.fullWidthPunchline}>Just steal their ideas.</h2>
        <aside className="notes">
        These ideas are great, and if I'm not going to steal them, someone else will.
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
        God, I love a good Venn diagram. Especially when three overlapping parts aren't labeled because, Corporate strategy.
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.provenTechnologyLayout}>
          <h2 className={styles.provenTechnologyTitle}>Why use a proven Technology?</h2>
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
        And there are a lot of companies that do this and a whole slew of other things extremely well, but, Where's the fun in that?
        </aside>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.solutionDiagramLayout}>
          <h2 className={styles.solutionDiagramTitle}>It's really not so bad</h2>
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
    Inbox --> InboxApi[listInbox / unread / read mutations]

    Handler --> ChatMirror[Chat mirror path]
    ChatMirror --> Timeline[ChatTimelineService.addSystemMessage]

    Handler --> Analytics[Analytics event]
    Handler --> Slack[Slack webhook]

    Push --> Expo[Expo push API]
    Email --> Provider[Email provider]

    classDef userLayer fill:#e1f5fe,color:#111827,stroke:#7dd3fc
    classDef eventLayer fill:#fff3e0,color:#111827,stroke:#f2a65a
    classDef notifyLayer fill:#e8f5e8,color:#111827,stroke:#86efac
    classDef storageLayer fill:#f1f8e9,color:#111827,stroke:#bef264
    classDef extLayer fill:#fce4ec,color:#111827,stroke:#f9a8d4

    class Service userLayer
    class EventBus,Handler eventLayer
    class Unified,Prefs,Push,Email,ChatMirror,Timeline,Analytics,Slack notifyLayer
    class Ledger,Inbox,InboxApi storageLayer
    class Expo,Provider extLayer`}
            className={styles.solutionMermaidDiagram}
          />
        </div>
        <aside className="notes">
        So yeah, obviously the next step is to create a mermaid diagram, because of course that's the next step. And it's really not so bad once we start to break down the system a little more and figure out what our requirements are. Our event bus publishes to a notification handler.Or really any subscriber, That way we can decouple our business logic And services from our side effects. And then from there we can Pass our event to any number of our services that handle our side effects, but most importantly, our notifications. Those are the ones that we deeply care about the most.
        </aside>
      </section>

      <EventBusTeachingMorphSlide deck={deck} steps={eventBusTeachingStep.slice(0, 3)} />
      <PayloadSchemaMorphSlide steps={eventBusTeachingStep} />

      <section className={styles.centeredContentSlide}>
        <div>
          <p className={styles.eyebrow}>Schema registry</p>
          <h2 className={styles.bigIdea}>Our contract</h2>
          <p className={styles.statement}>
            The event name owns the payload shape, the runtime validation, and
            the TypeScript type every subscriber sees.
          </p>
        </div>
      </section>

      <section className={styles.centeredContentSlide}>
        <div className={styles.eventRegistryLayout}>
          <h2 className={styles.eventRegistryTitle}>
            One event name ties the whole contract together
          </h2>
          <div className={styles.eventRegistryBody}>
            <StaticHighlightedCodeBlock
              className={styles.eventRegistryCode}
              steps={eventRegistryStep}
            />
            <div className={styles.eventRegistryNotes}>
              <p>notification type</p>
              <p>payload schema</p>
              <p>template schema</p>
              <p>inferred TypeScript payload</p>
            </div>
          </div>
        </div>
      </section>

      <CodeMorphSlide
        deck={deck}
        frameDataId="notification-service-code-frame"
        fragmentSteps={[1, 2, 3, 4, 5]}
        initialStep={0}
        layout="hero"
        steps={notificationServiceSteps}
        subtitle="Start with one service. Then make the delivery boundaries explicit."
        title="Dependency injection"
      />

      <section>
        <p className={styles.eyebrow}>Step 1</p>
        <h2 className={styles.sectionTitle}>Emit the event</h2>
        <StaticHighlightedCodeBlock steps={eventEmitStep} />
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={styles.sectionTitle}>Standard Action</h2>
      </section>

      <section className={styles.centerQuestionSlide}>
        <h2 className={styles.sectionTitle}>A beautiful red squiggle</h2>
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
          <code>{`this.ctx.eventBus.dispatch({
  type: DOMAIN_EVENTS.ITEM_INTEREST.FIRST_SHOWN,
  payload: {
  userId,
  userName: interestedUser.name || "there",
  gifterId,
  giftId: item.gift_id || undefined,
  giftTitle: item.gift?.name || undefined,
  itemId,
  itemTitle: item.title || undefined,
  shownAt: eventTimestamp,
  }
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
          <code>{`eventBus.dispatch({ type: DOMAIN_EVENTS.[HERO_EVENT], payload });`}</code>
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
