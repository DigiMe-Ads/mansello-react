const COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  pending_payment: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  paid_offline: "bg-emerald-100 text-emerald-700",
  packed: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-red-100 text-red-700",
  completed: "bg-slate-200 text-slate-700",
  new: "bg-amber-100 text-amber-700",
  read: "bg-sky-100 text-sky-700",
  responded: "bg-emerald-100 text-emerald-700",
  submitted: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        COLORS[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
