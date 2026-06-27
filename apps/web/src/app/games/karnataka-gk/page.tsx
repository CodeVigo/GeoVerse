import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "Karnataka GK · GeoVerse" };

export default function KarnatakaGkGamePage() {
  return <QuizGame title="🏞️ Karnataka GK" type="karnataka-gk" count={10} accent="#fbbf24" />;
}
