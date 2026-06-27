import { QuizGame } from "@/components/QuizGame";

export const metadata = { title: "Flag Finder · GeoVerse" };

export default function FlagsGamePage() {
  return <QuizGame title="🚩 Flag Finder" type="flags" count={10} accent="#2dd4bf" />;
}
