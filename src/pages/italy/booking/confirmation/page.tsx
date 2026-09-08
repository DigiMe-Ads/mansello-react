import { Suspense } from "react";
import ConfirmationContent from "./confirmation-content";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function BookingConfirmationPage() {
  useSeo(PAGE_META.italyBookingConfirmation);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EAF6FB]" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
