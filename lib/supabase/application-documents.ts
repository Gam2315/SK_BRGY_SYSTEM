import type { ApplicationDocumentLink } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function createApplicationDocumentLinks(
  supabase: SupabaseClient,
  documents: { label: string; path: string | null }[],
): Promise<{ links: ApplicationDocumentLink[]; errors: string[] }> {
  const links: ApplicationDocumentLink[] = [];
  const errors: string[] = [];

  for (const document of documents) {
    if (!document.path) {
      continue;
    }

    const { data, error } = await supabase.storage
      .from("application-documents")
      .createSignedUrl(document.path, 15 * 60);

    if (error) {
      console.warn(`Could not create link for ${document.label}:`, error.message);
      errors.push(`${document.label}: ${error.message}`);
      continue;
    }

    links.push({
      label: document.label,
      url: data.signedUrl,
      isImage: /\.(?:jpe?g|png|webp)$/i.test(document.path),
    });
  }

  return { links, errors };
}
