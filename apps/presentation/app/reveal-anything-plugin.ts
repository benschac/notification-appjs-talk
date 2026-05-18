import type { RevealApi, RevealPlugin } from "reveal.js";

type AnythingOptions = Record<string, unknown>;

export type AnythingConfig = Array<{
  className: string;
  defaults?: AnythingOptions;
  initialize: (container: HTMLElement, options: AnythingOptions) => void;
}>;

export type AnythingRevealConfig = {
  anything?: AnythingConfig;
};

function mergeDefaults(options: AnythingOptions, defaults: AnythingOptions) {
  const merged = { ...options };

  for (const [key, value] of Object.entries(defaults)) {
    if (merged[key] === undefined) {
      merged[key] = value;
    } else if (
      value &&
      merged[key] &&
      typeof value === "object" &&
      typeof merged[key] === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeDefaults(merged[key] as AnythingOptions, value as AnythingOptions);
    }
  }

  return merged;
}

function parseCommentOptions(container: HTMLElement) {
  const comments = container.innerHTML.trim().match(/<!--[\s\S]*?-->/g);

  if (!comments) {
    return null;
  }

  for (const comment of comments) {
    try {
      return JSON.parse(comment.replace(/<!--/, "").replace(/-->/, ""));
    } catch {
      // Try the next comment. Invalid slide-local JSON should not break the deck.
    }
  }

  return null;
}

export function createRevealAnythingPlugin(): RevealPlugin {
  const initializedElements = new WeakSet<HTMLElement>();

  return {
    id: "RevealAnything",
    init(deck: RevealApi) {
      const initializeAnything = () => {
        const revealElement = deck.getRevealElement();
        const config = (deck.getConfig() as AnythingRevealConfig).anything ?? [];

        if (!revealElement || config.length === 0) {
          return;
        }

        for (const item of config) {
          const elements = revealElement.getElementsByClassName(item.className);

          for (const element of Array.from(elements)) {
            if (!(element instanceof HTMLElement) || initializedElements.has(element)) {
              continue;
            }

            const defaults = item.defaults ?? {};
            const options = mergeDefaults(parseCommentOptions(element) ?? {}, defaults);

            item.initialize(element, options);
            initializedElements.add(element);
          }
        }
      };

      queueMicrotask(initializeAnything);
      deck.on("ready", initializeAnything);
      deck.on("slidechanged", initializeAnything);
      deck.on("slidesync", initializeAnything);

      return Promise.resolve();
    },
  };
}
