import type { Metadata } from "next";
import { ReportView } from "@/components/results/report-view";

export const metadata: Metadata = { title: "Report" };

export default function ReportPage() {
  return <ReportView />;
}
