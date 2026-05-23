"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ShikiMagicMovePrecompiled } from "shiki-magic-move/react";
import type { KeyedTokensInfo } from "shiki-magic-move/core";

import useEffectMeme from "./useEffectMeme.jpeg";
import styles from "../styles/deck.module.css";

type RevealDeck = {
  off: (eventName: string, callback: (event: RevealEvent) => void) => void;
  on: (eventName: string, callback: (event: RevealEvent) => void) => void;
};

type RevealEvent = {
  currentSlide?: Element | null;
  fragment?: Element | null;
};

const stepMessages = [
  "Direct side effects feel fine until each new surface adds another required call site.",
  "One more service means touching the same business flow again, more chances to break something.",
  "Emit one rich event instead and let handlers own push, email, inbox, chat, and navigation side effects.",
];

export function CodeMorphSlide({
  deck,
  frameDataId,
  fragmentSteps = [],
  initialStep,
  layout,
  showCopy = true,
  steps,
  subtitle,
  title,
}: {
  deck: RevealDeck | null;
  frameDataId: string;
  fragmentSteps?: number[];
  initialStep: number;
  layout: "hero" | "analysis";
  showCopy?: boolean;
  steps: KeyedTokensInfo[];
  subtitle: string;
  title: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(initialStep);
  const sectionRef = useRef<HTMLElement>(null);
  const isNotificationServiceSlide = frameDataId === "notification-service-code-frame";
  const stepMessage = stepMessages[step] ?? subtitle;

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
        setStep(initialStep);
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
  }, [deck, initialStep]);

  const frame = (
    <div
      data-id={frameDataId}
      className={`${styles.magicMoveFrame} ${
        layout === "hero" ? styles.magicMoveFrameHero : styles.magicMoveFrameAnalysis
      }`}
    >
      {isMounted ? (
        <ShikiMagicMovePrecompiled
          steps={steps}
          step={step}
          animate
          options={{
            duration: 700,
            lineNumbers: true,
            stagger: 0.18,
          }}
        />
      ) : (
        <div className={styles.magicMovePlaceholder} />
      )}
    </div>
  );

  if (!showCopy) {
    const showUseEffectMeme = step === 2;

    return (
      <section
        ref={sectionRef}
        className={`${styles.magicMoveSectionCodeOnly} ${
          showUseEffectMeme ? styles.magicMoveSectionCodeMeme : ""
        }`}
        data-auto-animate
        data-auto-animate-duration="0.7"
        data-auto-animate-easing="cubic-bezier(0.22, 1, 0.36, 1)"
        data-auto-animate-id="event-bus-code-journey"
      >
        <p className={styles.codeOnlyStatement}>These are all just side effects.</p>
        <div
          className={`${styles.codeMemeLayout} ${
            showUseEffectMeme ? styles.codeMemeLayoutVisible : ""
          }`}
        >
          {frame}
          <div
            aria-hidden={!showUseEffectMeme}
            className={styles.useEffectMemeSlot}
          >
            <Image
              alt="Follow up logic revealed as useEffect meme"
              className={styles.useEffectMeme}
              priority
              sizes="34rem"
              src={useEffectMeme}
            />
          </div>
        </div>
        {fragmentSteps.map((fragmentStep) => (
          <span
            key={fragmentStep}
            aria-hidden="true"
            className={`fragment custom ${styles.codeStepFragment}`}
            data-code-step={fragmentStep}
          />
        ))}
        <aside className="notes">
        When you start thinking that this isn't the primary use case, all these are just side effects. Something that I'd expect in a use effect hook, or maybe a redux thunk. We're making calls to systems that we don't control outside of our core business logic.
        </aside>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={`${layout === "hero" ? styles.magicMoveSectionHero : styles.magicMoveSectionAnalysis} ${
        isNotificationServiceSlide ? styles.magicMoveSectionDependencyInjection : ""
      }`}
      data-auto-animate
      data-auto-animate-duration="0.7"
      data-auto-animate-easing="cubic-bezier(0.22, 1, 0.36, 1)"
      data-auto-animate-id="event-bus-code-journey"
    >
      <h2
        className={`${styles.sectionTitle} ${
          layout === "analysis" ? styles.magicMoveAnalysisTitle : ""
        }`}
      >
        {title}
      </h2>
      {layout === "hero" ? (
        <div className={styles.magicMoveHero}>
          <p className={styles.magicMoveHeroBody}>{subtitle}</p>
          {frame}
          <p className={styles.magicMoveHeroCaption}>{stepMessage}</p>
        </div>
      ) : (
        <div className={styles.magicMoveLayout}>
          {frame}
          <div className={styles.magicMoveNotes}>
            <p className={styles.magicMoveLabel}>Current point</p>
            <p className={styles.magicMoveMessage}>{stepMessage}</p>
            <p className={styles.magicMoveAnalysisBody}>{subtitle}</p>
            <ul className={styles.magicMoveChecklist}>
              <li>Step 1: direct notification calls live inside the mutation</li>
              <li>Step 2: another consumer makes the flow wider and more fragile</li>
              <li>Step 3: one emitted event fans out to dedicated handlers</li>
            </ul>
          </div>
        </div>
      )}
      {fragmentSteps.map((fragmentStep) => (
        <span
          key={fragmentStep}
          aria-hidden="true"
          className={`fragment custom ${styles.codeStepFragment}`}
          data-code-step={fragmentStep}
        />
      ))}
      <aside className="notes">
        <ul>
          <li>
            So now that we have this typed event bus working, we have our
            domain-driven events.
          </li>
          <li>
            Now we start to think about how it's all going to start to come
            together.
          </li>
          <li>Dependency injection makes this really simple.</li>
          <li>
            We can plug in Expo push notifications, or resend emails, our user
            preferences, notification ledger for in-app notifications, and you
            know, a configuration object, because you know why not?
          </li>
        </ul>
      </aside>
    </section>
  );
}
