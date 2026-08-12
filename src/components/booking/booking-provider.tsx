"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getPropertyBySlug } from "@/lib/api/properties";
import { getAvailability } from "@/lib/api/availability";
import { createBooking } from "@/lib/api/bookings";
import { submitTransportRequest } from "@/lib/api/leads";
import { buildBlockedDateSet, isRangeAvailable } from "@/lib/availability";
import { guestCountOptions, roomOptionsForGuestCount } from "@/lib/api/pricing";
import { addDaysToKey, todayKey } from "@/lib/date";
import { ApiRequestError, isConflict, isValidationError } from "@/lib/api/errors";
import type { Booking, TransportType } from "@/lib/api/types";
import type { Property } from "@/lib/api/types";

type Step = "select" | "details" | "payment";

export interface GuestDetailsInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdDocumentType?: string;
  guestIdDocumentNumber?: string;
  wantsTransport?: boolean;
  transportType?: TransportType;
  transportDate?: string;
  transportFlightNumber?: string;
  transportNotes?: string;
}

interface BookingProviderState {
  property: Property | null;
  loading: boolean;
  error: string | null;
  blockedDates: Set<string>;
  step: Step;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  rooms: number;
  // Of `guests`, how many are under the property's cityTaxExemptAgeUnder —
  // only meaningful (and only shown in the UI) when property.cityTaxEnabled.
  childrenUnder14: number;
  booking: Booking | null;
  clientSecret: string | null;
  submitting: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string>;
  selectDay: (key: string) => void;
  setGuests: (n: number) => void;
  setRooms: (n: number) => void;
  setChildrenUnder14: (n: number) => void;
  goToDetails: () => void;
  backToSelect: () => void;
  submitGuestDetails: (input: GuestDetailsInput) => Promise<void>;
  reset: () => void;
  refetchAvailability: () => Promise<void>;
}

const BookingContext = createContext<BookingProviderState | null>(null);

// Fetch a generous forward window once so month navigation doesn't need to
// refetch — the calendar UI itself caps how far a guest can actually navigate.
const AVAILABILITY_WINDOW_DAYS = 372;

export function BookingProvider({
  propertySlug,
  children,
}: {
  propertySlug: string;
  children: React.ReactNode;
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());

  const [step, setStep] = useState<Step>("select");
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuestsState] = useState(1);
  const [rooms, setRoomsState] = useState(1);
  const [childrenUnder14, setChildrenUnder14State] = useState(0);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadAvailability = useCallback(async (propertyId: string) => {
    const from = todayKey();
    const to = addDaysToKey(from, AVAILABILITY_WINDOW_DAYS);
    const blocks = await getAvailability(propertyId, from, to);
    const blocked = buildBlockedDateSet(blocks);
    setBlockedDates(blocked);
    return blocked;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const prop = await getPropertyBySlug(propertySlug);
        if (cancelled) return;
        setProperty(prop);
        const guestOptions = guestCountOptions(prop.pricingTiers);
        if (guestOptions.length && !guestOptions.includes(1)) setGuestsState(guestOptions[0]);
        const blocked = await loadAvailability(prop.id);
        if (cancelled) return;

        // Pick up a selection made on the homepage's reservation widget
        // before it linked here (?checkIn=&checkOut=&guests=) — only
        // applied if it still checks out against live availability.
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const qCheckIn = params.get("checkIn");
          const qCheckOut = params.get("checkOut");
          const qGuests = params.get("guests");

          if (
            qCheckIn &&
            qCheckOut &&
            qCheckIn >= todayKey() &&
            qCheckIn < qCheckOut &&
            isRangeAvailable(blocked, qCheckIn, qCheckOut)
          ) {
            setCheckIn(qCheckIn);
            setCheckOut(qCheckOut);
          }

          if (qGuests) {
            const n = Number(qGuests);
            if (guestOptions.includes(n)) {
              setGuestsState(n);
              const roomOptions = roomOptionsForGuestCount(prop.pricingTiers, n);
              if (roomOptions.length) setRoomsState(roomOptions[0]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load property");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [propertySlug, loadAvailability]);

  const refetchAvailability = useCallback(async () => {
    if (property) await loadAvailability(property.id);
  }, [property, loadAvailability]);

  const selectDay = useCallback(
    (key: string) => {
      if (blockedDates.has(key) || key < todayKey()) return;

      setCheckIn((prevCheckIn) => {
        if (!prevCheckIn || checkOut) {
          setCheckOut(null);
          return key;
        }
        if (key <= prevCheckIn || !isRangeAvailable(blockedDates, prevCheckIn, key)) {
          setCheckOut(null);
          return key;
        }
        setCheckOut(key);
        return prevCheckIn;
      });
    },
    [blockedDates, checkOut]
  );

  const setGuests = useCallback(
    (n: number) => {
      setGuestsState(n);
      if (property) {
        const options = roomOptionsForGuestCount(property.pricingTiers, n);
        if (options.length && !options.includes(rooms)) setRoomsState(options[0]);
      }
      // Can't have more tax-exempt children than total guests.
      setChildrenUnder14State((c) => Math.min(c, n));
    },
    [property, rooms]
  );

  const setRooms = useCallback((n: number) => setRoomsState(n), []);

  const setChildrenUnder14 = useCallback(
    (n: number) => setChildrenUnder14State(Math.max(0, Math.min(n, guests))),
    [guests]
  );

  const goToDetails = useCallback(() => {
    setSubmitError(null);
    setStep("details");
  }, []);

  const backToSelect = useCallback(() => {
    setSubmitError(null);
    setFieldErrors({});
    setStep("select");
  }, []);

  const reset = useCallback(() => {
    setStep("select");
    setCheckIn(null);
    setCheckOut(null);
    setChildrenUnder14State(0);
    setBooking(null);
    setClientSecret(null);
    setSubmitError(null);
    setFieldErrors({});
  }, []);

  const submitGuestDetails = useCallback(
    async (input: GuestDetailsInput) => {
      if (!property || !checkIn || !checkOut) return;
      setSubmitting(true);
      setSubmitError(null);
      setFieldErrors({});

      try {
        const result = await createBooking({
          propertyId: property.id,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          guestIdDocumentType: input.guestIdDocumentType || undefined,
          guestIdDocumentNumber: input.guestIdDocumentNumber || undefined,
          checkIn,
          checkOut,
          guests,
          rooms,
          childrenUnder14,
        });
        setBooking(result.booking);
        setClientSecret(result.clientSecret);
        setStep("payment");

        // Transport add-on is a best-effort side request — the booking
        // itself already succeeded, so a failure here shouldn't block
        // checkout. Guest can still request transport separately if it fails.
        if (input.wantsTransport) {
          try {
            await submitTransportRequest({
              propertyId: property.id,
              bookingId: result.booking.id,
              type: input.transportType ?? "fixed_price",
              date: input.transportDate || checkIn,
              flightNumber: input.transportFlightNumber || undefined,
              passengers: guests,
              contactName: input.guestName,
              contactEmail: input.guestEmail,
              contactPhone: input.guestPhone,
              notes: input.transportNotes || undefined,
            });
          } catch {
            // Silently ignore — see comment above.
          }
        }
      } catch (err) {
        if (isConflict(err)) {
          setSubmitError(err.message);
          await refetchAvailability();
          setStep("select");
          setCheckIn(null);
          setCheckOut(null);
        } else if (isValidationError(err) && err.details) {
          const errors: Record<string, string> = {};
          for (const d of err.details) errors[d.path.replace(/^body\./, "")] = d.message;
          setFieldErrors(errors);
        } else if (err instanceof ApiRequestError) {
          setSubmitError(err.message);
        } else {
          setSubmitError("Something went wrong. Please try again.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [property, checkIn, checkOut, guests, rooms, childrenUnder14, refetchAvailability]
  );

  const value = useMemo<BookingProviderState>(
    () => ({
      property,
      loading,
      error,
      blockedDates,
      step,
      checkIn,
      checkOut,
      guests,
      rooms,
      childrenUnder14,
      booking,
      clientSecret,
      submitting,
      submitError,
      fieldErrors,
      selectDay,
      setGuests,
      setRooms,
      setChildrenUnder14,
      goToDetails,
      backToSelect,
      submitGuestDetails,
      reset,
      refetchAvailability,
    }),
    [
      property,
      loading,
      error,
      blockedDates,
      step,
      checkIn,
      checkOut,
      guests,
      rooms,
      childrenUnder14,
      booking,
      clientSecret,
      submitting,
      submitError,
      fieldErrors,
      selectDay,
      setGuests,
      setRooms,
      setChildrenUnder14,
      goToDetails,
      backToSelect,
      submitGuestDetails,
      reset,
      refetchAvailability,
    ]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function usePropertyBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("usePropertyBooking must be used within a BookingProvider");
  return ctx;
}
