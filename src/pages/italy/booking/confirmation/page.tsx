import { Suspense } from "react";
import ConfirmationContent from "./confirmation-content";

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EAF6FB]" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
