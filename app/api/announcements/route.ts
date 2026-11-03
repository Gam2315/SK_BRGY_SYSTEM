import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Could not load public announcements:", error.message);
    return NextResponse.json(
      { error: "Public announcements are temporarily unavailable." },
      { status: 500 },
    );
  }

  return NextResponse.json({ announcements: data ?? [] });
}
