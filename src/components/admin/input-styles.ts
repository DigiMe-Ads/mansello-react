// Shared, explicit styling for every admin form control. Deliberately direct
// Tailwind utilities (not a CSS-cascade trick) so text/placeholder contrast
// is guaranteed regardless of layer ordering.
export const ADMIN_INPUT =
  "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#153C4D] focus:outline-none";

export const ADMIN_TEXTAREA =
  "resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#153C4D] focus:outline-none";

export const ADMIN_SELECT =
  "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:border-[#153C4D] focus:outline-none";
