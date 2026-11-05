import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id, kind, title, body, activity_date, image_paths, published_at")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Could not load public community posts:", error.message);
    return NextResponse.json(
      { error: "Community activities and projects are temporarily unavailable." },
      { status: 500 },
    );
  }

  const posts = (data ?? []).map((post) => ({
    id: post.id,
    kind: post.kind,
    title: post.title,
    body: post.body,
    activity_date: post.activity_date,
    published_at: post.published_at,
    image_urls: post.image_paths.map(
      (path) =>
        supabase.storage
          .from("community-post-images")
          .getPublicUrl(path).data.publicUrl,
    ),
  }));

  return NextResponse.json({ posts });
}
