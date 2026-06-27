import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "Guess the Landmark · GeoVerse" };

export default function LandmarksGamePage() {
  return <QuizGame title="📸 Guess the Landmark" type="landmarks" count={10} accent="#f472b6" />;
}
