import { handleAuth } from "@workos-inc/authkit-nextjs";
import { type NextRequest, NextResponse } from "next/server";

function logError(error: unknown): void {
  console.error("[Callback] Error handling auth:", error);
  console.error(
    "[Callback] Error type:",
    error instanceof Error ? error.constructor.name : typeof error
  );
  console.error(
    "[Callback] Error message:",
    error instanceof Error ? error.message : String(error)
  );
  console.error(
    "[Callback] Error stack:",
    error instanceof Error ? error.stack : "No stack trace"
  );

  if (error instanceof Error && error.message.includes("fetch")) {
    console.error(
      "[Callback] Fetch error detected - possible network/API issue"
    );
    console.error(
      "[Callback] Check WorkOS API connectivity and environment variables"
    );
  }
}

function extractErrorDetails(error: unknown): {
  message: string;
  code?: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error instanceof Error && "code" in error ? String(error.code) : undefined;
  return { message, code };
}

function isEmailExistsError(
  errorMessage: string,
  errorCode: string | undefined,
  errorDescription: string | null,
  errorParam: string | null
): boolean {
  return (
    errorMessage.includes("email is not available") ||
    errorMessage.includes("email already exists") ||
    errorCode === "user_already_exists" ||
    errorDescription?.toLowerCase().includes("email") === true ||
    errorParam === "user_already_exists"
  );
}

function createSignInRedirect(request: NextRequest): NextResponse {
  const signInUrl = new URL("/login", request.url);
  signInUrl.searchParams.set("error", "email_exists");
  signInUrl.searchParams.set(
    "message",
    "This email is already registered. Please sign in instead."
  );
  return NextResponse.redirect(signInUrl);
}

function createHomeRedirect(
  request: NextRequest,
  errorMessage: string,
  errorDescription: string | null
): NextResponse {
  const homeUrl = new URL("/", request.url);
  homeUrl.searchParams.set("error", "auth_failed");
  homeUrl.searchParams.set(
    "message",
    errorMessage || errorDescription || "Authentication failed"
  );
  return NextResponse.redirect(homeUrl);
}

export const GET = async (request: NextRequest) => {
  try {
    console.log("[Callback] Starting auth handler");
    console.log("[Callback] Request URL:", request.url);
    console.log(
      "[Callback] Code param:",
      request.nextUrl.searchParams.get("code")
    );

    // handleAuth returns a function that takes NextRequest
    const authHandler = handleAuth({
      returnPathname: "/router",
    });

    return await authHandler(request);
  } catch (error) {
    logError(error);

    const { message: errorMessage, code: errorCode } =
      extractErrorDetails(error);

    const errorParam = request.nextUrl.searchParams.get("error");
    const errorDescription =
      request.nextUrl.searchParams.get("error_description");

    if (
      isEmailExistsError(errorMessage, errorCode, errorDescription, errorParam)
    ) {
      return createSignInRedirect(request);
    }

    return createHomeRedirect(request, errorMessage, errorDescription);
  }
};
