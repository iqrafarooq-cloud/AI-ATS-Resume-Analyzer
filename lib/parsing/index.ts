import "server-only";
import { AppError } from "@/lib/errors";
import { normalizeText, wordCount } from "@/lib/text";
import { extractDocx } from "@/lib/parsing/docx";
import { extractPdf, type ExtractedDocument } from "@/lib/parsing/pdf";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeFileKind = "pdf" | "docx";

export function detectKind(file: File, bytes: Uint8Array): ResumeFileKind {
  const name = file.name.toLowerCase();
  const isPdfMagic = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  const isZipMagic = bytes[0] === 0x50 && bytes[1] === 0x4b;

  if ((name.endsWith(".pdf") || file.type === PDF_MIME) && isPdfMagic) return "pdf";
  if ((name.endsWith(".docx") || file.type === DOCX_MIME) && isZipMagic) return "docx";

  if (name.endsWith(".pdf") || name.endsWith(".docx")) {
    throw new AppError("CORRUPTED_FILE", "This file's contents don't match its extension. It may be corrupted or renamed.");
  }
  if (name.endsWith(".doc")) {
    throw new AppError("UNSUPPORTED_FILE", "Legacy .doc files aren't supported. Please save as .docx or PDF.");
  }
  throw new AppError("UNSUPPORTED_FILE", "Unsupported file type. Please upload a PDF or DOCX resume.");
}

export interface ParsedResumeFile extends ExtractedDocument {
  kind: ResumeFileKind;
}

export async function parseResumeFile(file: File): Promise<ParsedResumeFile> {
  if (file.size === 0) throw new AppError("EMPTY_FILE", "This file is empty. Please choose another resume.");
  if (file.size > MAX_FILE_BYTES) throw new AppError("FILE_TOO_LARGE", "Resume files must be 5 MB or smaller.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectKind(file, buffer);
  const doc = kind === "pdf" ? await extractPdf(new Uint8Array(buffer)) : await extractDocx(buffer);
  const text = normalizeText(doc.text);

  if (wordCount(text) < 40) {
    throw new AppError(
      kind === "pdf" ? "UNREADABLE_PDF" : "EMPTY_RESUME",
      kind === "pdf"
        ? "We found almost no readable text in this PDF. It may be a scanned image, which most ATS systems can't read either. Try a text-based PDF or a Word file."
        : "We found almost no text in this document. Please check the file and try again.",
    );
  }

  return { ...doc, text: text.slice(0, 60000), kind };
}
