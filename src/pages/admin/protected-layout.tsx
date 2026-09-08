import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "@/components/admin/admin-auth-provider";
import { RequireAdmin } from "@/components/admin/require-admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { useSeo } from "@/lib/seo/use-seo";
import { PRIVATE_META } from "@/lib/seo/page-meta";

// Layout route for every /admin/* page except the login screen. Mirrors the
// original Next `admin/(protected)/layout.tsx`, rendering nested routes through
// React Router's <Outlet /> instead of Next's {children}.
export default function ProtectedAdminLayout() {
  // One call here covers every nested /admin/* route: staff screens must never
  // be indexed, and they show guest PII.
  useSeo(PRIVATE_META.admin("Staff"));

  return (
    <AdminAuthProvider>
      <RequireAdmin>
        <AdminShell>
          <Outlet />
        </AdminShell>
      </RequireAdmin>
    </AdminAuthProvider>
  );
}
