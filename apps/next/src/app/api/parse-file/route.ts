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
    const formData = await req.formData();
    const backendUrl = `${env.NEXT_PUBLIC_PYTHON_API_URL}/api/v1/parse-file`;

    const response = await fetch(backendUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to parse file" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error parsing file:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to parse file: ${errorMessage}` },
      { status: 500 }
    );
  }
};
