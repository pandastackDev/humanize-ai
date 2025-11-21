import { handleAuth } from "@workos-inc/authkit-nextjs";
import { type NextRequest, NextResponse } from "next/server";

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

    // Log fetch errors specifically
    if (error instanceof Error && error.message.includes("fetch")) {
      console.error(
        "[Callback] Fetch error detected - possible network/API issue"
      );
      console.error(
        "[Callback] Check WorkOS API connectivity and environment variables"
      );
    }

    // Extract error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error instanceof Error && "code" in error
        ? String(error.code)
        : undefined;

    // Check URL for error parameters from WorkOS
    const errorParam = request.nextUrl.searchParams.get("error");
    const errorDescription =
      request.nextUrl.searchParams.get("error_description");

    // If it's an "email not available" error, redirect to sign in
    if (
      errorMessage.includes("email is not available") ||
      errorMessage.includes("email already exists") ||
      errorCode === "user_already_exists" ||
      errorDescription?.toLowerCase().includes("email") ||
      errorParam === "user_already_exists"
    ) {
      // Redirect to sign in page with a message
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("error", "email_exists");
      signInUrl.searchParams.set(
        "message",
        "This email is already registered. Please sign in instead."
      );
      return NextResponse.redirect(signInUrl);
    }

    // For other errors, redirect to home with error
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("error", "auth_failed");
    homeUrl.searchParams.set(
      "message",
      errorMessage || errorDescription || "Authentication failed"
    );
    return NextResponse.redirect(homeUrl);
  }
};
