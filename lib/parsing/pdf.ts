import "server-only";
import { AppError } from "@/lib/errors";

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  /** Signals that matter for ATS compatibility. */
  signals: { tables: number; images: number; multiColumnSuspected: boolean };
}

interface TextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
}

export async function extractPdf(buffer: Uint8Array): Promise<ExtractedDocument> {
  const { getDocumentProxy } = await import("unpdf");

  let doc: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    doc = await getDocumentProxy(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/password/i.test(message)) {
      throw new AppError("UNREADABLE_PDF", "This PDF is password-protected. Please upload an unlocked copy.");
    }
    throw new AppError("CORRUPTED_FILE", "We couldn't open this PDF. It may be damaged, so try exporting it again.");
  }

  const pages: string[] = [];
  let multiColumnSuspected = false;

  try {
    for (let p = 1; p <= Math.min(doc.numPages, 10); p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let out = "";
      let lastY: number | null = null;
      let lastX: number | null = null;
      let backwardJumps = 0;

      for (const raw of content.items as TextItem[]) {
        if (typeof raw.str !== "string") continue;
        const x = raw.transform?.[4] ?? null;
        const y = raw.transform?.[5] ?? null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && !out.endsWith("\n")) {
          out += "\n";
          // Text that jumps far up the page usually means a second column.
          if (y - lastY > 120) backwardJumps++;
        } else if (lastX !== null && x !== null && x - lastX > 0 && out && !out.endsWith(" ") && !out.endsWith("\n") && raw.str && !raw.str.startsWith(" ")) {
          out += " ";
        }
        out += raw.str;
        if (raw.hasEOL) out += "\n";
        lastY = y;
        lastX = x;
      }
      if (backwardJumps >= 2) multiColumnSuspected = true;
      pages.push(out);
    }
  } catch {
    throw new AppError("UNREADABLE_PDF", "We couldn't read the text in this PDF. Try exporting it again from your editor.");
  }

  return {
    text: pages.join("\n\n"),
    pageCount: doc.numPages,
    signals: { tables: 0, images: 0, multiColumnSuspected },
  };
}
