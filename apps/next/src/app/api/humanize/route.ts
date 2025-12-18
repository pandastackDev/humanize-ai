import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

export const POST = async (req: NextRequest) => {
  if (!env.NEXT_PUBLIC_PYTHON_API_URL) {
    return NextResponse.json(
      { error: "Backend URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const backendUrl = `${env.NEXT_PUBLIC_PYTHON_API_URL}/api/v1/humanize`;

    // Forward headers from the original request
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Forward user and organization IDs if present
    const userId = req.headers.get("x-user-id");
    const organizationId = req.headers.get("x-organization-id");

    if (userId) {
      headers["X-User-Id"] = userId;
    }
    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to humanize text" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error humanizing text:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to humanize text: ${errorMessage}` },
      { status: 500 }
    );
  }
};
