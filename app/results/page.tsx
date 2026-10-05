import type { Metadata } from "next";
import { ResultsDashboard } from "@/components/results/results-dashboard";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage() {
  return <ResultsDashboard />;
}
