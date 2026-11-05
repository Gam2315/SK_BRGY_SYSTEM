import { Suspense } from "react";
import { notFound } from "next/navigation";
import DashboardLoading from "@/components/dashboard-loading";
import { AdminDashboardPage } from "../admin-dashboard";
import type { AdminDashboardSection } from "@/components/portal-dashboard";

const adminPages = [
  "education-applicants",
  "jobseeker-applicants",
  "activity-logs",
] as const;

export default function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminSectionPage params={params} />
    </Suspense>
  );
}

async function AdminSectionPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;

  if (!isAdminDashboardPage(page)) {
    notFound();
  }

  return <AdminDashboardPage page={page} />;
}

function isAdminDashboardPage(
  page: string,
): page is Exclude<AdminDashboardSection, "overview"> {
  return adminPages.some((adminPage) => adminPage === page);
}
