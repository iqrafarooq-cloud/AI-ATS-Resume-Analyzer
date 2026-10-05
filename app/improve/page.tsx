import type { Metadata } from "next";
import { ImproveWorkspace } from "@/components/improve/improve-workspace";

export const metadata: Metadata = { title: "Improve" };

export default function ImprovePage() {
  return <ImproveWorkspace />;
}
