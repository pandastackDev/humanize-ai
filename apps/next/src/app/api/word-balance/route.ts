import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId query parameter is required" },
      { status: 400 }
    );
  }

  if (!env.NEXT_PUBLIC_PYTHON_API_URL) {
    return NextResponse.json(
      { error: "Backend URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const backendUrl = `${env.NEXT_PUBLIC_PYTHON_API_URL}/api/v1/billing/word-balance?organization_id=${encodeURIComponent(organizationId)}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch word balance" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching word balance:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to fetch word balance: ${errorMessage}` },
      { status: 500 }
    );
  }
};
