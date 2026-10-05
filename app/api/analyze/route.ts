import { analyzeApplication } from "@/lib/ai/analyzer";
import { AppError, toErrorResponse } from "@/lib/errors";
import { parseResumeFile } from "@/lib/parsing";
import { sanitizeText, wordCount } from "@/lib/text";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_JOB_CHARS = 20000;

export async function POST(request: Request) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AppError("INVALID_INPUT", "The upload couldn't be read. Please try again.");
    }

    const file = form.get("resume");
    const jobRaw = form.get("jobDescription");

    if (!(file instanceof File)) throw new AppError("INVALID_INPUT", "Please upload your resume as a PDF or DOCX file.");
    if (typeof jobRaw !== "string" || wordCount(jobRaw) < 20) {
      throw new AppError("EMPTY_JOB", "Please paste a job description of at least 20 words.");
    }
    if (jobRaw.length > MAX_JOB_CHARS) {
      throw new AppError("INVALID_INPUT", `Job descriptions are limited to ${MAX_JOB_CHARS.toLocaleString()} characters.`);
    }

    const parsed = await parseResumeFile(file);
    const analysis = await analyzeApplication({
      file: parsed,
      fileName: sanitizeText(file.name, 200),
      jobText: sanitizeText(jobRaw, MAX_JOB_CHARS),
    });

    return Response.json(analysis, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
