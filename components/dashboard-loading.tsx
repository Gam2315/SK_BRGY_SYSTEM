import Image from "next/image";

export default function DashboardLoading() {
  return (
    <div
      aria-label="Loading dashboard"
      className="dashboard-loading"
      role="status"
    >
      <div className="dashboard-loading-content">
        <Image
          alt=""
          className="dashboard-loading-logo"
          height={192}
          src="/centro-norte-logo.png"
          width={192}
        />
      </div>
    </div>
  );
}
