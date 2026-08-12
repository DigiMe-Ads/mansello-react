import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { AdminAccount, CreateAdminUserInput, DashboardData } from "./types";

export function getDashboard(fetcher: AuthedFetch) {
  return fetcher<DashboardData>("/api/admin/dashboard");
}

export function createAdminUser(fetcher: AuthedFetch, input: CreateAdminUserInput) {
  return fetcher<{ id: string; email: string; role: string; propertyScopeId: string | null }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listAdminUsers(fetcher: AuthedFetch) {
  return fetcher<AdminAccount[]>("/api/admin/users");
}

export function deleteAdminUser(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/admin/users/${id}`, { method: "DELETE" });
}
