"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "./admin-auth-provider";
import type { AdminRole } from "@/lib/api/types";

export function RequireAdmin({ roles, children }: { roles?: AdminRole[]; children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) router.replace("/admin/login");
  }, [loading, admin, router]);

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5F0] text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (roles && !roles.includes(admin.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-6 text-center">
        <p className="text-sm text-slate-500">You don&apos;t have access to this section.</p>
      </div>
    );
  }

  return <>{children}</>;
}
