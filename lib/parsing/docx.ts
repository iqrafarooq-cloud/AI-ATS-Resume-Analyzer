import "server-only";
import { AppError } from "@/lib/errors";
import type { ExtractedDocument } from "@/lib/parsing/pdf";

export async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const mammoth = await import("mammoth");

  // DOCX files are ZIP archives and must start with "PK".
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new AppError("CORRUPTED_FILE", "This DOCX file appears to be corrupted. Try saving it again from Word or Google Docs.");
  }

  try {
    const [raw, html] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }, { convertImage: mammoth.images.imgElement(async () => ({ src: "" })) }),
    ]);
    const tables = (html.value.match(/<table/g) ?? []).length;
    const images = (html.value.match(/<img/g) ?? []).length;
    return {
      text: raw.value,
      pageCount: Math.max(1, Math.round(raw.value.split(/\s+/).length / 500)),
      signals: { tables, images, multiColumnSuspected: tables > 0 && tables <= 2 },
    };
  } catch {
    throw new AppError("UNREADABLE_DOCX", "We couldn't read this DOCX file. Try saving it again or upload a PDF instead.");
  }
}
