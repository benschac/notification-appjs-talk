import { getCodeMorphSteps } from "./code-morph-data";
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
  const codeMorphSteps = await getCodeMorphSteps();

  return <PresentationDeck codeMorphSteps={codeMorphSteps} snapshot={snapshot} />;
}
