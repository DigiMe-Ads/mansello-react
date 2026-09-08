"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT } from "@/components/admin/input-styles";
import { createAdminUser, deleteAdminUser, listAdminUsers } from "@/lib/api/admin";
import { getProperties } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/errors";
import { formatDisplayDate } from "@/lib/date";
import type { AdminAccount, AdminRole, Property } from "@/lib/api/types";
import { AdminField } from "@/components/admin/admin-field";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  villa_manager: "Villa Manager",
  marketplace_manager: "Marketplace Manager",
};

export default function AdminUsersPage() {
  return (
    <RequireAdmin roles={["super_admin"]}>
      <AdminUsersContent />
    </RequireAdmin>
  );
}

function AdminUsersContent() {
  const { admin, authedFetch } = useAdminAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("villa_manager");
  const [propertyScopeId, setPropertyScopeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAccounts = useCallback(() => {
    setLoading(true);
    listAdminUsers(authedFetch)
      .then(setAccounts)
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Failed to load admin accounts"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    getProperties().then(setProperties).catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, [loadAccounts]);

  function propertyName(id: string | null) {
    if (!id) return null;
    return properties.find((p) => p.id === id)?.name ?? id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createAdminUser(authedFetch, {
        email,
        password,
        role,
        propertyScopeId: role === "villa_manager" ? propertyScopeId || undefined : undefined,
      });
      setSuccess(`Admin account created for ${created.email}.`);
      setEmail("");
      setPassword("");
      loadAccounts();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create admin account");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(account: AdminAccount) {
    setDeletingId(account.id);
    setDeleteError(null);
    try {
      await deleteAdminUser(authedFetch, account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete admin account");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#153C4D]">Admin Users</h1>

      <form onSubmit={handleSubmit} className="max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Create Admin Account</h2>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</p>}

        <div className="mt-4 flex flex-col gap-3">
          <AdminField label="Email address" required help="They'll sign in with this.">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ADMIN_INPUT}
            />
          </AdminField>
          <AdminField label="Temporary password" required help="Share it with them securely; they should change it after signing in.">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={ADMIN_INPUT}
            />
          </AdminField>
          <AdminField label="Role" help="Controls which sections of this panel they can open.">
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={ADMIN_SELECT}>
            <option value="super_admin">Super Admin</option>
            <option value="villa_manager">Villa Manager</option>
            <option value="marketplace_manager">Marketplace Manager</option>
          </select>
          </AdminField>
          {role === "villa_manager" && (
            <select
              value={propertyScopeId}
              onChange={(e) => setPropertyScopeId(e.target.value)}
              className={ADMIN_SELECT}
            >
              <option value="">Scope to property...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Account"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">All Admin Accounts</h2>
        {deleteError && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{deleteError}</p>}
        {loadError && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p>}
        {loading && <p className="text-sm text-slate-500">Loading...</p>}

        {!loading && !loadError && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                      No admin accounts yet.
                    </td>
                  </tr>
                )}
                {accounts.map((account) => {
                  const isSelf = account.id === admin?.id;
                  return (
                    <tr key={account.id}>
                      <td className="border-t border-slate-100 px-4 py-3">
                        <p className="font-semibold text-[#153C4D]">{account.email}</p>
                        {isSelf && <p className="text-xs text-slate-400">This is you</p>}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {ROLE_LABELS[account.role]}
                        </span>
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                        {propertyName(account.propertyScopeId) ?? "—"}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                        {formatDisplayDate(account.createdAt.slice(0, 10))}
                      </td>
                      <td className="border-t border-slate-100 px-4 py-3 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-300">Can&apos;t delete your own account</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(account)}
                            disabled={deletingId === account.id}
                            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                          >
                            {deletingId === account.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
