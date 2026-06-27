import type { Metadata } from "next";
import "./globals.css";
import { ModeProvider } from "@/components/ModeProvider";
import { TopBar } from "@/components/TopBar";
import { SearchPalette } from "@/components/SearchPalette";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "GeoVerse — Explore the World, Learn Geography",
    template: "%s · GeoVerse",
  },
  description:
    "GeoVerse is an interactive 3D geography learning platform for curious explorers and competitive-exam aspirants. Explore countries, states, rivers, and more.",
  keywords: [
    "geography",
    "interactive map",
    "3D globe",
    "UPSC",
    "SSC",
    "KPSC",
    "India geography",
    "world geography",
  ],
  openGraph: {
    title: "GeoVerse — Explore the World, Learn Geography",
    description:
      "Explore an interactive 3D globe and master geography for exams and curiosity.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ModeProvider>
            <TopBar />
            <SearchPalette />
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
