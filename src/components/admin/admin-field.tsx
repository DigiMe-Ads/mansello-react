// Wraps an admin form control in a real <label> with optional helper text.
//
// Most admin inputs previously relied on a placeholder alone, which disappears
// the moment you start typing — so a half-filled form gave no indication of
// what each box was, and screen readers had nothing to announce. Placeholders
// are for examples; labels are for names.
export function AdminField({
  label,
  help,
  required,
  className = "",
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {help && <span className="text-xs font-normal text-slate-400">{help}</span>}
      {children}
    </label>
  );
}
