import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "Indian State Capitals · GeoVerse" };

export default function IndiaCapitalsGamePage() {
  return (
    <QuizGame title="🇮🇳 Indian State Capitals" type="capitals" scope="india" count={10} accent="#fbbf24" />
  );
}
