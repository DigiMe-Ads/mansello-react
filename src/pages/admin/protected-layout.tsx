import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "@/components/admin/admin-auth-provider";
import { RequireAdmin } from "@/components/admin/require-admin";
import { AdminShell } from "@/components/admin/admin-shell";

// Layout route for every /admin/* page except the login screen. Mirrors the
// original Next `admin/(protected)/layout.tsx`, rendering nested routes through
// React Router's <Outlet /> instead of Next's {children}.
export default function ProtectedAdminLayout() {
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
