"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ApiRequestError } from "@/lib/api/errors";
import { useSeo } from "@/lib/seo/use-seo";
import { PRIVATE_META } from "@/lib/seo/page-meta";

export default function AdminLoginPage() {
  useSeo(PRIVATE_META.admin("Sign in"));

  return (
    <AdminAuthProvider>
      <LoginForm />
    </AdminAuthProvider>
  );
}

function LoginForm() {
  const { login } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="admin-app" className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-6">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-10 shadow-lg">
        <h1 className="text-2xl font-bold text-[#153C4D]">Mansello Admin</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage villas, marketplace, and leads.</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#153C4D]"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#153C4D]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-[#8DC63F] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
