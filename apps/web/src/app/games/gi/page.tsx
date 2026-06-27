import type { Metadata } from "next";
import { QuizGame } from "@/components/QuizGame";

export const metadata: Metadata = { title: "GI Tags Quiz · GeoVerse" };

export default function GiQuizPage() {
  return <QuizGame title="🏷️ GI Tags Quiz" type="gi" accent="#fbbf24" />;
}
