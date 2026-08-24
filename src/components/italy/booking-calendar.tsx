"use client";

import { BookingCalendarView } from "@/components/booking/booking-calendar-view";

export default function BookingCalendar() {
  return (
    <BookingCalendarView
      confirmationPath="/italy/booking/confirmation"
      guestFieldsMode="adults"
      showTransport={false}
    />
  );
}
