"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "./admin-auth-provider";
import type { AdminRole } from "@/lib/api/types";

const NAV_ITEMS: { href: string; label: string; roles?: AdminRole[] }[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/villas", label: "Villas", roles: ["super_admin", "villa_manager"] },
  { href: "/admin/marketplace/products", label: "Products", roles: ["super_admin", "marketplace_manager"] },
  { href: "/admin/marketplace/orders", label: "Orders", roles: ["super_admin", "marketplace_manager"] },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/heatmap", label: "Heatmap", roles: ["super_admin"] },
  { href: "/admin/blog", label: "Blog", roles: ["super_admin"] },
  { href: "/admin/testimonials", label: "Testimonials", roles: ["super_admin"] },
  { href: "/admin/settings/guest-info-form", label: "Guest Info Form", roles: ["super_admin"] },
  { href: "/admin/users", label: "Admin Users", roles: ["super_admin"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth();
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.roles || (admin && item.roles.includes(admin.role)));

  return (
    <div id="admin-app" className="flex min-h-screen bg-[#F7F5F0]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <p className="px-2 text-lg font-bold text-[#153C4D]">Mansello Admin</p>
        <nav className="mt-8 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname?.startsWith(item.href) ? "bg-[#153C4D] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* min-w-0 overrides the flex default of min-width:auto — without it,
          a flex item never shrinks below its widest descendant's natural
          size, so a wide child (like the Heatmap tab's device preview)
          would push this whole column wider than the space actually next
          to the sidebar, forcing the entire dashboard to scroll
          horizontally instead of the one component that needs to. */}
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-semibold text-[#153C4D]">{admin?.email}</span>{" "}
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase">{admin?.role}</span>
          </p>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
