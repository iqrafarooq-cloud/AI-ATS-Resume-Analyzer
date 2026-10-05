export type AppErrorCode =
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "CORRUPTED_FILE"
  | "UNREADABLE_PDF"
  | "UNREADABLE_DOCX"
  | "EMPTY_RESUME"
  | "EMPTY_JOB"
  | "INVALID_INPUT"
  | "AI_NOT_CONFIGURED"
  | "AI_TIMEOUT"
  | "AI_FAILED"
  | "AI_MALFORMED"
  | "INTERNAL";

const STATUS: Record<AppErrorCode, number> = {
  UNSUPPORTED_FILE: 415,
  FILE_TOO_LARGE: 413,
  EMPTY_FILE: 400,
  CORRUPTED_FILE: 422,
  UNREADABLE_PDF: 422,
  UNREADABLE_DOCX: 422,
  EMPTY_RESUME: 422,
  EMPTY_JOB: 400,
  INVALID_INPUT: 400,
  AI_NOT_CONFIGURED: 503,
  AI_TIMEOUT: 504,
  AI_FAILED: 502,
  AI_MALFORMED: 502,
  INTERNAL: 500,
};

/** An error whose message is safe to show to end users. */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  // Log only the error type/message, never request content (resumes are private).
  console.error("[resumepilot] unexpected error:", error instanceof Error ? error.message : "unknown");
  return Response.json(
    { error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again." } },
    { status: 500 },
  );
}
