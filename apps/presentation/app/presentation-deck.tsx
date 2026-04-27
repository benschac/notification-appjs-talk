"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes";
import type { KeyedTokensInfo } from "shiki-magic-move/core";

import { CodeMorphSlide } from "./code-morph-slide";
import { TypeScriptErrorSlides } from "./typescript-error-slide";
import styles from "../styles/deck.module.css";

type TalkSnapshot = {
  apiBaseUrl: string | null;
  generatedAt: string;
};

export function PresentationDeck({
  codeMorphSteps,
  snapshot,
}: {
  codeMorphSteps: KeyedTokensInfo[];
  snapshot: TalkSnapshot;
}) {
  const deckRef = useRef<HTMLDivElement>(null);
  const [deck, setDeck] = useState<InstanceType<typeof Reveal> | null>(null);

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

  return (
    <div ref={deckRef} className="reveal">
      <div className="slides">
        <section data-auto-animate>
          <p className={styles.eyebrow}>Another Treasure</p>
          <h1 className={styles.heroTitle}>Backend-aware slides, not screenshots</h1>
          <p className={styles.heroBody}>
            A dedicated Next.js app for the talk, running reveal.js in the
            browser while keeping backend access in normal app code.
          </p>
          <div className={styles.metaRow}>
            <span>{backendLabel}</span>
            <span>{snapshot.generatedAt}</span>
          </div>
          <aside className="notes">
            Open with the architecture choice. The deck is a real app, so live
            data and route handlers stay available during the talk.
          </aside>
        </section>

        <section>
          <section>
            <h2 className={styles.sectionTitle}>Why Next.js works for this</h2>
            <div className={styles.cardGrid}>
              <article className={styles.card}>
                <h3>Client-only deck runtime</h3>
                <p>
                  Reveal initializes inside a client component, which matches
                  its browser-driven API and keyboard controls.
                </p>
              </article>
              <article className={styles.card}>
                <h3>Server-side data when needed</h3>
                <p>
                  The page itself can stay async, fetch data on the server, and
                  pass a stable snapshot into the deck.
                </p>
              </article>
              <article className={styles.card}>
                <h3>Normal deploy story</h3>
                <p>
                  This remains a standard monorepo app with its own build,
                  dev, and lint tasks.
                </p>
              </article>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Where backend calls belong</h2>
            <pre className={styles.codeBlock}>
              <code>{`// app/page.tsx
const snapshot = await fetchTalkMetrics();
return <PresentationDeck snapshot={snapshot} />;`}</code>
            </pre>
            <p className={styles.caption}>
              Use server components for stable preloaded data, or fetch inside
              interactive slides when you need live updates.
            </p>
          </section>
        </section>

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

        <CodeMorphSlide
          deck={deck}
          frameDataId="event-bus-code-frame"
          fragmentSteps={[2]}
          initialStep={1}
          layout="analysis"
          steps={codeMorphSteps}
          subtitle="Now the same code block has moved into analysis mode. One more click turns the wide mutation into a single emitted domain event."
          title="Move the code into the explanation"
        />

        <section data-auto-animate>
          <p className={styles.eyebrow}>Deck goals</p>
          <h2 className={styles.sectionTitle}>What this app gives you immediately</h2>
          <ul className={styles.checklist}>
            <li>Full-screen keyboard-driven slides with speaker notes support</li>
            <li>Room for charts, demos, and live backend-backed moments</li>
            <li>A clean app boundary inside `apps/presentation`</li>
            <li>A predictable local URL on port `305`</li>
          </ul>
          <aside className="notes">
            Mention that this can grow into API-driven demos without changing
            presentation tooling later.
          </aside>
        </section>

        <TypeScriptErrorSlides />

        <section>
          <h2 className={styles.sectionTitle}>Recommended operating model</h2>
          <div className={styles.timeline}>
            <div>
              <span className={styles.timelineStep}>01</span>
              <p>Draft slides as JSX so animation and live UI stay easy.</p>
            </div>
            <div>
              <span className={styles.timelineStep}>02</span>
              <p>Fetch durable talk data on the server before render.</p>
            </div>
            <div>
              <span className={styles.timelineStep}>03</span>
              <p>Reserve client fetches for demos that need current state.</p>
            </div>
          </div>
        </section>

        <section>
          <p className={styles.eyebrow}>Speaker Notes</p>
          <h2 className={styles.sectionTitle}>Speaker View Test Slide</h2>
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
