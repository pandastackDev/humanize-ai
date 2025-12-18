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
    const backendUrl = `${env.NEXT_PUBLIC_PYTHON_API_URL}/api/v1/detect`;
    console.log("backendUrl", backendUrl);
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || errorData.message || "Detection failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error detecting AI content:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to detect AI content: ${errorMessage}` },
      { status: 500 }
    );
  }
};
