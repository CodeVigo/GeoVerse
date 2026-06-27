import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "Daily Challenge · GeoVerse" };

export default function DailyGamePage() {
  return (
    <QuizGame
      title="⚡ Daily Challenge"
      type="daily"
      count={10}
      accent="#f59e0b"
      fixedLength
    />
  );
}
