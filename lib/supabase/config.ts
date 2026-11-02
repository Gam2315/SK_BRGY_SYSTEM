export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isAdminEmail(email: string | undefined) {
  const adminEmail = process.env.BARANGAY_ADMIN_EMAIL?.trim().toLowerCase();

  return Boolean(adminEmail && email?.trim().toLowerCase() === adminEmail);
}
