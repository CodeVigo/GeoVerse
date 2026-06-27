import type { Metadata } from "next";
import { SolarSystem } from "@/components/SolarSystem";

export const metadata: Metadata = {
  title: "Solar System · GeoVerse",
  description:
    "Live positions of the eight planets around the Sun, computed for the current date — explore each planet.",
};

export default function SolarSystemPage() {
  return <SolarSystem />;
}
