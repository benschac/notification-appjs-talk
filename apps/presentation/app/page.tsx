import { getTalkCodeSteps } from "./code-morph-data";
import { PresentationDeck } from "./presentation-deck";

type TalkSnapshot = {
  apiBaseUrl: string | null;
  generatedAt: string;
};

async function getTalkSnapshot(): Promise<TalkSnapshot> {
  return {
    apiBaseUrl: process.env.PRESENTATION_API_BASE_URL ?? null,
    generatedAt: new Date().toISOString(),
  };
}

export default async function PresentationPage() {
  const snapshot = await getTalkSnapshot();
  const codeSteps = await getTalkCodeSteps();

  return <PresentationDeck {...codeSteps} snapshot={snapshot} />;
}
