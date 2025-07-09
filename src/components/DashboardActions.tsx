"use client";

import { useRouter } from "next/navigation";

export function DashboardActions() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm bg-secondary rounded hover:bg-secondary/80 transition-colors"
    >
      Logout
    </button>
  );
}