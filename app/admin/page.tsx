import { Suspense } from "react";
import { redirect } from "next/navigation";
import PortalDashboard from "@/components/portal-dashboard";
import { getSupabaseConfig, isAdminEmail } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="dashboard-loading">Loading your dashboard...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}

async function AdminDashboard() {
  if (!getSupabaseConfig()) {
    redirect("/login?error=setup");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not verify admin dashboard session:", error.message);
  }

  if (!data.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(data.user.email)) {
    redirect("/dashboard");
  }

  return <PortalDashboard email={data.user.email} role="admin" />;
}
