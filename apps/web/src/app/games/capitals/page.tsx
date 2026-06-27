import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "World Capitals · GeoVerse" };

export default function CapitalsGamePage() {
  return <QuizGame title="🏛️ World Capitals" type="capitals" count={10} accent="#a5b4fc" />;
}
