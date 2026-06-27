import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "World Geography GK · GeoVerse" };

export default function WorldGkGamePage() {
  return <QuizGame title="🌍 World Geography GK" type="world-gk" count={10} accent="#5eead4" />;
}
