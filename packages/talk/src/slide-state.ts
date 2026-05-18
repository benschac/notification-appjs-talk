import type { TalkSlideState } from "./contracts";

export type BuildTalkSlideStateInput = {
  talkId: string;
  slideIndex: number;
  slideCount: number;
  title?: string | null;
  section?: string | null;
  takeaway?: string | null;
  deepLink?: string | null;
  updatedAt?: Date | string;
};

const fallbackTitle = (slideIndex: number) => `Slide ${slideIndex + 1}`;

const optionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toIsoString = (value?: Date | string) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ?? new Date().toISOString();
};

export function buildTalkSlideState(input: BuildTalkSlideStateInput): TalkSlideState {
  return {
    talkId: input.talkId,
    slideIndex: input.slideIndex,
    slideCount: input.slideCount,
    title: optionalText(input.title) ?? fallbackTitle(input.slideIndex),
    section: optionalText(input.section),
    takeaway: optionalText(input.takeaway),
    updatedAt: toIsoString(input.updatedAt),
    deepLink: optionalText(input.deepLink),
  };
}
