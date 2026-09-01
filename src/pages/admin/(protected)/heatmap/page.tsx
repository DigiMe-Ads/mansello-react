"use client";

import { RequireAdmin } from "@/components/admin/require-admin";
import { HeatmapViewer } from "@/components/admin/heatmap/heatmap-viewer";

export default function AdminHeatmapPage() {
  return (
    <RequireAdmin roles={["super_admin"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#153C4D]">Heatmap</h1>
          <p className="mt-1 text-sm text-slate-500">
            See where visitors actually click on each page — hotter colors mean more clicks.
          </p>
        </div>
        <HeatmapViewer />
      </div>
    </RequireAdmin>
  );
}
