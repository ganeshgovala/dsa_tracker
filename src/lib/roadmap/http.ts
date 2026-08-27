import { NextResponse } from "next/server";
import { ConflictError, NotFoundError, ValidationError } from "./validation";

/** Maps data-layer errors to HTTP responses for the roadmap API routes. */
export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof ConflictError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  const message =
    err instanceof Error && err.message.includes("not configured")
      ? "Firebase is not configured on the server. Set the NEXT_PUBLIC_FIREBASE_* env vars."
      : "Internal server error";
  console.error("[roadmap api]", err);
  return NextResponse.json(
    { error: message },
    { status: message.startsWith("Firebase") ? 503 : 500 },
  );
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new ValidationError("Request body must be a JSON object");
    }
    return body as Record<string, unknown>;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError("Invalid JSON request body");
  }
}
