import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const tableName = searchParams.get("table") || "company";

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(tableName)
      .update({
        email_opened: true,
        updated_at: new Date().toISOString(),
      })
      .eq("email_id", email)
      .select("id");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update email tracking" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Company not found with provided email" },
        { status: 404 }
      );
    }

    // Return a 1x1 transparent pixel for email tracking
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
