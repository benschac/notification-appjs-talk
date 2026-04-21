"use client";

import dynamic from "next/dynamic";

import styles from "../styles/deck.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const workingCode = `export {};

type PickupCompletedEvent = {
  type: "pickup.completed";
  payload: {
    giftId: string;
    giverName: string;
    navigationTarget: string;
  };
};

function dispatchNotificationNavigation(notificationEvent: PickupCompletedEvent) {
  return notificationEvent.payload.navigationTarget;
}

const notificationEvent: PickupCompletedEvent = {
  type: "pickup.completed",
  payload: {
    giftId: "gift_42",
    giverName: "Ben",
    navigationTarget: "/gifts/gift_42",
  },
};

dispatchNotificationNavigation(notificationEvent);`;

const brokenCode = `export {};

type PickupCompletedEvent = {
  type: "pickup.completed";
  payload: {
    giftId: string;
    giverName: string;
    navigationTarget: string;
  };
};

function dispatchNotificationNavigation(notificationEvent: PickupCompletedEvent) {
  return notificationEvent.payload.navigationTarget;
}

const notificationEvent: PickupCompletedEvent = {
  type: "pickup.completed",
  payload: {
    giftId: "gift_42",
    giverName: "Ben",
    route: "/gifts/gift_42",
  },
};

dispatchNotificationNavigation(notificationEvent);`;

type TypeScriptSandboxSlideProps = {
  frameDataId: string;
  mode: "working" | "broken";
  layout: "hero" | "analysis";
  subtitle: string;
  title: string;
};

function TypeScriptSandboxSlide({
  frameDataId,
  mode,
  layout,
  subtitle,
  title,
}: TypeScriptSandboxSlideProps) {
  const code = mode === "working" ? workingCode : brokenCode;

  const editor = (
    <div
      data-id={frameDataId}
      className={`${styles.tsEditorFrame} ${
        layout === "hero" ? styles.tsEditorFrameHero : styles.tsEditorFrameAnalysis
      }`}
    >
      <MonacoEditor
        beforeMount={(monaco) => {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            exactOptionalPropertyTypes: true,
            lib: ["es2020"],
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            noEmit: true,
            noImplicitAny: true,
            strict: true,
            target: monaco.languages.typescript.ScriptTarget.ES2020,
          });
          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSuggestionDiagnostics: false,
            noSyntaxValidation: false,
          });
        }}
        defaultLanguage="typescript"
        height={layout === "hero" ? "340px" : "300px"}
        options={{
          automaticLayout: true,
          fontSize: layout === "hero" ? 13 : 12,
          hover: {
            above: false,
            enabled: true,
            sticky: true,
          },
          lineHeight: layout === "hero" ? 19 : 18,
          minimap: { enabled: false },
          padding: {
            top: 10,
            bottom: 10,
          },
          quickSuggestions: false,
          scrollBeyondLastLine: false,
          wordWrap: "on",
        }}
        path={`event-contract-${mode}.ts`}
        theme="vs-dark"
        value={code}
      />
    </div>
  );

  return (
    <section
      data-auto-animate
      data-auto-animate-duration="0.7"
      data-auto-animate-easing="cubic-bezier(0.22, 1, 0.36, 1)"
      data-auto-animate-id="typescript-sandbox-journey"
    >
      {layout === "hero" ? (
        <div className={styles.tsSlideLayout}>
          <div className={styles.tsSlideCopy}>
            <p className={styles.eyebrow}>TypeScript</p>
            <h2 className={`${styles.sectionTitle} ${styles.tsTitle}`}>{title}</h2>
            <div className={styles.tsSlideHeader}>
              <div className={styles.tsStateRow}>
                <span className={`${styles.tsStateChip} ${styles.tsStateChipActive}`}>
                  {mode === "working" ? "Working" : "Broken"}
                </span>
              </div>
              <p className={styles.tsMeta}>{subtitle}</p>
            </div>
          </div>
          {editor}
        </div>
      ) : (
        <div className={styles.tsAnalysisLayout}>
          {editor}
          <div className={styles.tsAnalysisCopy}>
            <p className={styles.eyebrow}>TypeScript</p>
            <h2 className={`${styles.sectionTitle} ${styles.tsTitleAnalysis}`}>{title}</h2>
            <p className={styles.tsMeta}>{subtitle}</p>
            <ul className={styles.tsAnalysisList}>
              <li>The event contract expects `navigationTarget`, not `route`.</li>
              <li>The editor flags the payload mismatch before runtime wiring gets touched.</li>
              <li>This is the same sandbox frame, moved into explanation mode on the next slide.</li>
            </ul>
          </div>
        </div>
      )}
      <aside className="notes">
        Start with the healthy contract, then move the same sandbox frame into a
        more analytical layout and show the bad payload shape.
      </aside>
    </section>
  );
}

export function TypeScriptErrorSlides() {
  return (
    <>
      <TypeScriptSandboxSlide
        frameDataId="typescript-sandbox-frame"
        layout="hero"
        mode="working"
        subtitle="Start with the valid event contract so the audience sees the intended payload shape before anything breaks."
        title="Show the contract working first"
      />
      <TypeScriptSandboxSlide
        frameDataId="typescript-sandbox-frame"
        layout="analysis"
        mode="broken"
        subtitle="Now the same sandbox frame has moved into a new slide. The payload changed, the wrong field name is underlined, and the contract failure becomes the point."
        title="Move the sandbox into the explanation"
      />
    </>
  );
}
