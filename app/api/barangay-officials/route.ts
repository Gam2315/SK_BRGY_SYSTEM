import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barangay_officials")
    .select("id, position, full_name, phone, email, photo_path, sort_order")
    .eq("is_published", true)
    .not("full_name", "is", null)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Could not load public barangay officials:", error.message);
    return NextResponse.json(
      { error: "Published barangay officials are temporarily unavailable." },
      { status: 500 },
    );
  }

  const officials = (data ?? []).map((official) => ({
    id: official.id,
    position: official.position,
    full_name: official.full_name,
    phone: official.phone,
    email: official.email,
    sort_order: official.sort_order,
    photo_url: official.photo_path
      ? supabase.storage
          .from("barangay-official-photos")
          .getPublicUrl(official.photo_path).data.publicUrl
      : null,
  }));

  return NextResponse.json({ officials });
}
