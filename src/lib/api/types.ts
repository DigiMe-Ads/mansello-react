export type StripeAccountRef = "italy" | "sri_lanka";

export interface PricingTier {
  id: string;
  propertyId: string;
  guestCount: number;
  rooms: number;
  pricePerNight: string;
}

// Airport transfer pricing for a property, quoted per party size rather than
// per person — a 4-guest transfer is one vehicle, not 4x the 1-guest price.
// Optional add-on at booking: the guest ticks it, the server looks up the row
// matching their guest count and adds it once to the total. Spec'd in
// BACKEND_CHANGES_VILLA_TRANSPORT.md.
export interface TransportRate {
  id: string;
  propertyId: string;
  guestCount: number; // 1-8
  price: string;
  active: boolean;
}

export interface UpsertTransportRateInput {
  guestCount: number;
  price: number;
  active: boolean;
}

// A per-guest, per-night municipal tax band — e.g. Bologna's city tax, which
// tiers by the accommodation's price-per-person/night. Not in
// API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES_CITY_TAX.md.
export interface CityTaxBand {
  minPricePerPersonPerNight: number;
  maxPricePerPersonPerNight: number | null; // null = no upper bound (highest band)
  ratePerPersonPerNight: number;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  minNights: number;
  turnoverBufferDays: number;
  maxGuests: number;
  address: string;
  stripeAccountRef: StripeAccountRef;
  airbnbIcalImportUrls: string[];
  icalExportToken: string;
  createdAt: string;
  updatedAt: string;
  pricingTiers: PricingTier[];
  // Airport-transfer add-on master switch, set from the villa admin's
  // Transport tab. Absent/false on a not-yet-updated backend, which reads as
  // "this property doesn't offer transfers" and hides the option entirely
  // rather than erroring. See BACKEND_CHANGES_VILLA_TRANSPORT.md.
  transportEnabled?: boolean;
  transportRates?: TransportRate[];
  // City/tourist tax config — currently only Bologna's has this enabled.
  // Optional so a property from a not-yet-updated backend simply reads as
  // "no tax", not undefined/crashing.
  cityTaxEnabled?: boolean;
  cityTaxMaxNights?: number; // tax stops accruing after this many nights of a stay
  cityTaxExemptAgeUnder?: number; // guests younger than this pay no tax
  cityTaxBands?: CityTaxBand[];
  // Named, individually-bookable rooms (e.g. Dona's Villa's Ella Room,
  // Mirissa Room, Sigiriya Family Suite) — spec'd in
  // BACKEND_CHANGES_SRI_LANKA_ROOMS.md, not yet in API_DOCUMENTATION.md.
  // Optional/absent for properties that book as a single unit (e.g. The Nest
  // Bologna), which keep using pricingTiers instead. When present, active
  // rooms should already be sorted by sortOrder.
  rooms?: Room[];
  // Admin-defined date-range price overrides (seasonal/peak pricing) layered
  // on top of the base pricingTiers/room rates — spec'd in
  // BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md, not yet in
  // API_DOCUMENTATION.md. Optional/absent for a not-yet-updated backend, in
  // which case pricing simply falls back to the base rates everywhere.
  rateOverrides?: RateOverride[];
}

// A date-range price override — "charge X/night for this room [or this
// guests×rooms tier] between these dates instead of the base rate". Not
// shown to guests as a calendar; only ever resolved down to a single
// per-night price for whatever dates they've actually selected. See
// BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md.
export interface RateOverride {
  id: string;
  propertyId: string;
  // Exactly one of (roomId) or (guestCount + rooms) is set, matching
  // whichever pricing model the property uses — roomId for room-based
  // properties (Dona's Villa), guestCount/rooms for tier-based ones
  // (The Nest Bologna).
  roomId?: string | null;
  guestCount?: number | null;
  rooms?: number | null;
  startDate: string;
  endDate: string; // inclusive on the admin form; treated as covering every night up to and including this date
  pricePerNight: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateOverrideInput {
  roomId?: string;
  guestCount?: number;
  rooms?: number;
  startDate: string;
  endDate: string;
  pricePerNight: number;
}

export type UpdateRateOverrideInput = Partial<CreateRateOverrideInput>;

// One individually-bookable room within a property that has more than one
// (Dona's Villa). Each room has its own nightly rate and capacity, and is
// booked/blocked independently of the property's other rooms.
export interface Room {
  id: string;
  propertyId: string;
  name: string; // e.g. "Ella Room"
  subtitle: string; // e.g. "Double Room" or "Family Suite — 4 guests"
  capacity: number; // max guests this room sleeps
  pricePerNight: string;
  images: string[];
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomInput {
  name: string;
  subtitle?: string;
  capacity: number;
  pricePerNight: number;
  images?: string[];
  sortOrder?: number;
}

export interface UpdateRoomInput {
  name?: string;
  subtitle?: string;
  capacity?: number;
  pricePerNight?: number;
  images?: string[];
  sortOrder?: number;
  active?: boolean;
}

export type AvailabilitySource = "direct" | "airbnb" | "manual";
export type BlockStatus = "active" | "cancelled";

export interface AvailabilityBlock {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  source: AvailabilitySource;
  status: BlockStatus;
  externalUid: string | null;
  bookingId: string | null;
  createdAt: string;
  updatedAt: string;
  // Which room this block applies to, for properties with individually
  // bookable rooms (see Room). Absent/null means the block applies to every
  // room on the property — this is how whole-property blocks (iCal imports,
  // manual maintenance blocks, and any property with no rooms at all) keep
  // working unchanged. Optional so a not-yet-updated backend still parses.
  roomId?: string | null;
}

export type BookingStatus = "pending_payment" | "confirmed" | "paid_offline" | "cancelled" | "completed";

export interface Booking {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdDocumentType: string | null;
  guestIdDocumentNumber: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  // Specific rooms reserved, for properties with individually bookable rooms
  // (see Room). Absent for single-unit properties (The Nest Bologna).
  roomIds?: string[];
  // accommodationPrice + cityTax = totalPrice (the amount actually charged).
  // accommodationPrice/cityTax are optional so a booking from a
  // not-yet-updated backend still renders — falls back to showing just
  // totalPrice with no breakdown.
  accommodationPrice?: string;
  // Set only when the guest added an airport transfer. Absent means none was
  // requested (or the booking predates the feature).
  transportPrice?: string;
  cityTax?: string;
  childrenUnder14?: number;
  totalPrice: string;
  currency: string;
  stripePaymentIntentId: string | null;
  status: BookingStatus;
  expiresAt: string | null;
  cancelledAt: string | null;
  refundAmount: string | null;
  refundReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestIdDocumentType?: string;
  guestIdDocumentNumber?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  // Specific room IDs being reserved, for properties with individually
  // bookable rooms — required (and validated server-side for combined
  // capacity + per-room availability) whenever the property has rooms.
  roomIds?: string[];
  // How many of `guests` are under the property's cityTaxExemptAgeUnder
  // (14, for Bologna) — exempt from city tax. Ignored server-side for
  // properties with cityTaxEnabled: false.
  childrenUnder14?: number;
  // Whether the guest wants the airport transfer add-on. Deliberately a
  // boolean, not an amount: the server looks the price up from the property's
  // transportRates by guest count, so the client can never influence what is
  // charged. See BACKEND_CHANGES_VILLA_TRANSPORT.md.
  transportRequested?: boolean;
}

export interface CreateBookingResponse {
  booking: Booking;
  clientSecret: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  // Short blurb + image shown on the storefront's featured-categories
  // section, and a flag for whether this category is one of the (at most 4)
  // featured on that section. Optional/absent for a not-yet-updated backend
  // — the featured section then just renders nothing. Spec'd in
  // BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md. The full marketplace
  // listing page always shows every category regardless of `featured`.
  description?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
}

export interface StockLevel {
  id: string;
  productId: string;
  quantityOnHand: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  description: string;
  priceUsd: string;
  images: string[];
  sku: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  stockLevel: StockLevel | null;
  // Weight of a single unit, in kg — drives the per-order shipping fee
  // (see ShippingRate). Optional/absent for a not-yet-updated backend or a
  // product created before this field existed; treated as 0kg (no weight
  // contribution) until set. Spec'd in
  // BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md.
  weightKg?: string | null;
}

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  lineTotal: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string | null;
  status: OrderStatus;
  paymentMethod: string;
  // Set once payment is confirmed — mirrors Booking.stripePaymentIntentId.
  // Optional/absent for a not-yet-updated backend or an order placed before
  // the marketplace switched from cash-on-delivery to card payment.
  stripePaymentIntentId?: string | null;
  shippingFee: string;
  subtotal: string;
  total: string;
  flaggedForReview: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  shippingFee: number;
  items: { productId: string; quantity: number }[];
}

// The marketplace now takes payment up front through the same Sri Lanka
// Stripe account used for Dona's Villa bookings, mirroring
// CreateBookingResponse — the order is created in a pending state alongside
// a PaymentIntent, and only moves to "confirmed" once that payment succeeds.
// Not in API_DOCUMENTATION.md yet — spec'd in
// BACKEND_CHANGES_MARKETPLACE_PAYMENTS.md.
export interface CreateOrderResponse {
  order: Order;
  clientSecret: string;
}

export interface LowStockItem extends StockLevel {
  product: Product;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  description: string;
  priceUsd: number;
  images: string[];
  sku: string;
  initialStock: number;
  lowStockThreshold?: number;
  weightKg?: number;
}

export interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  description?: string;
  priceUsd?: number;
  images?: string[];
  active?: boolean;
  weightKg?: number;
}

// Admin-configurable per-kg shipping cost band (e.g. rows for 1kg, 2kg, ...
// 15kg), used to price delivery off a cart's total weight
// (sum of product.weightKg × quantity). Not in API_DOCUMENTATION.md yet —
// spec'd in BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md.
export interface ShippingRate {
  id: string;
  fromKg: number;
  toKg: number;
  // FLAT delivery price for an order in this weight band — NOT a per-kg rate.
  // A 3kg order in a band priced 9.99 ships for 9.99, full stop. This was
  // previously named `pricePerKg` and multiplied by the cart weight, which
  // double-counted: bands are 1kg wide, so the band already encodes the
  // weight. See BACKEND_CHANGES_SHIPPING_FLAT_BAND_PRICING.md.
  price: string;
  // Legacy name, still read so a backend that hasn't been updated yet keeps
  // working. Never write this. Remove once the backend serves `price`.
  pricePerKg?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertShippingRateInput {
  fromKg: number;
  toKg: number;
  price: number;
}

// --- Admin ---

export type AdminRole = "super_admin" | "villa_manager" | "marketplace_manager";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  // Not present in the raw /api/admin/login response body — the backend only
  // encodes it into the JWT payload. AdminAuthProvider decodes it client-side
  // (read-only, unverified — the server independently verifies on every
  // request) so villa_manager UI can scope itself to one property.
  propertyScopeId: string | null;
}

export interface LoginResponse {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: AdminRole;
  propertyScopeId?: string;
}

// What GET /api/admin/users returns per row — unlike AdminUser (decoded from
// the JWT for the currently-logged-in admin), this always carries createdAt
// and never a passwordHash.
export interface AdminAccount {
  id: string;
  email: string;
  role: AdminRole;
  propertyScopeId: string | null;
  createdAt: string;
}

export interface BookingWithProperty extends Booking {
  property: Property;
}

export interface RevenueByProperty {
  propertyId: string;
  _sum: { totalPrice: string | null };
}

export interface DashboardData {
  upcomingCheckIns: BookingWithProperty[];
  upcomingCheckOuts: BookingWithProperty[];
  revenueByProperty: RevenueByProperty[];
  lowStockCount: number;
  pendingOrdersCount: number;
}

export interface CreateOfflineBookingInput extends CreateBookingInput {
  totalPriceOverride?: number;
}

export interface CancelBookingInput {
  refundOverride?: number;
  reason?: string;
}

export interface CreateManualBlockInput {
  startDate: string;
  endDate: string;
  reason?: string;
  // Blocks just this one room instead of the whole property. Omit to block
  // every room (or the whole property, if it has none).
  roomId?: string;
}

export interface UpdatePropertyInput {
  minNights?: number;
  turnoverBufferDays?: number;
  checkInTime?: string;
  checkOutTime?: string;
  airbnbIcalImportUrls?: string[];
  maxGuests?: number;
  // Master on/off switch for the airport-transfer add-on shown to guests
  // during booking — separate from the per-party-size `active` flags on
  // transport_rates, which decide which party sizes are priced. This is the
  // one the admin toggles to pull the option for guests entirely, for
  // either villa. See BACKEND_CHANGES_VILLA_TRANSPORT.md.
  transportEnabled?: boolean;
}

export interface UpdatePricingTierInput {
  guestCount: number;
  rooms?: number;
  pricePerNight: number;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
}

// --- Leads ---

export type LeadStatus = "new" | "read" | "responded";
export type ContactSubject = "room_booking" | "airport_transfer" | "tour_package" | "marketplace" | "other";
export type Site = "italy" | "sri_lanka";

export interface ContactMessage {
  id: string;
  site: Site;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  status: LeadStatus;
  createdAt: string;
}

export interface CreateContactMessageInput {
  site: Site;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
}

export type TransportType = "fixed_price" | "custom_quote";

export interface TransportRequest {
  id: string;
  propertyId: string | null;
  // Not in API_DOCUMENTATION.md yet — spec'd in
  // BACKEND_CHANGES_BOOKING_TRANSPORT.md, links a transport add-on picked
  // during checkout back to the booking it was requested alongside.
  bookingId: string | null;
  type: TransportType;
  date: string;
  flightNumber: string | null;
  passengers: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string | null;
  status: LeadStatus;
  createdAt: string;
}

export interface CreateTransportRequestInput {
  propertyId?: string;
  bookingId?: string;
  type: TransportType;
  date: string;
  flightNumber?: string;
  passengers: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  site: Site;
  subscribedAt: string;
}

// A "can't find it in the catalog" request from the marketplace — the guest
// describes an item, we source it and quote them back. Not a purchase: no
// price, no cart, no payment. Spec'd in BACKEND_CHANGES_MARKETPLACE_CUSTOM_ORDERS.md.
export interface CustomOrderRequest {
  id: string;
  site: Site;
  name: string;
  email: string;
  itemDescription: string;
  notes: string | null;
  status: LeadStatus;
  createdAt: string;
}

export interface CreateCustomOrderRequestInput {
  site: Site;
  name: string;
  email: string;
  itemDescription: string;
  notes?: string;
}

export interface SubscribeNewsletterInput {
  email: string;
  site: Site;
}

// --- Offers (spec'd in BACKEND_CHANGES.md, not yet in API_DOCUMENTATION.md) ---

export interface Offer {
  id: string;
  propertyId: string;
  title: string;
  discountPercent: number;
  imageUrl: string | null;
  active: boolean;
  // Date range the discount actually applies within — optional/absent means
  // "applies whenever active" (today's behavior, kept for backend
  // compatibility). When set, the discount is prorated per night: only
  // nights whose date falls inside [startDate, endDate] get discountPercent
  // off; other nights of the same stay are charged normally. See
  // BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md.
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferInput {
  propertyId: string;
  title: string;
  discountPercent: number;
  imageUrl?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOfferInput {
  title?: string;
  discountPercent?: number;
  imageUrl?: string;
  active?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// --- Blog (spec'd in BACKEND_CHANGES.md, not yet in API_DOCUMENTATION.md) ---

export interface BlogPost {
  id: string;
  site: Site;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  author: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostInput {
  site: Site;
  title: string;
  slug?: string;
  excerpt: string;
  body: string;
  coverImageUrl?: string;
  author: string;
  publishedAt?: string | null;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  coverImageUrl?: string;
  author?: string;
  publishedAt?: string | null;
}

// --- Guest info requests (post-booking "fill in your details" links) —
// spec'd in BACKEND_CHANGES_GUEST_INFO_REQUESTS.md, not yet in
// API_DOCUMENTATION.md ---

export type GuestInfoFieldType = "text" | "textarea" | "date" | "number" | "select" | "checkbox" | "file";

export interface GuestInfoField {
  // Client-generated (crypto.randomUUID()) when the field is added in the
  // template editor, and kept stable across edits — this is the key each
  // submitted answer is stored under, so it must never be reused for a
  // different question.
  id: string;
  label: string;
  type: GuestInfoFieldType;
  required: boolean;
  options?: string[]; // only meaningful for type "select"
}

// `string[]` is for type "file" — uploaded document URLs.
export type GuestInfoAnswerValue = string | boolean | string[];
export type GuestInfoAnswers = Record<string, GuestInfoAnswerValue>;

// Single shared template (not per-property) that new info-request links are
// built from. Admin-editable so the question list doesn't need a code change.
export interface GuestInfoFormTemplate {
  fields: GuestInfoField[];
  updatedAt: string;
}

export interface UpdateGuestInfoFormTemplateInput {
  fields: GuestInfoField[];
}

export type BookingInfoRequestStatus = "pending" | "submitted" | "expired";

export interface BookingInfoRequest {
  id: string;
  bookingId: string;
  status: BookingInfoRequestStatus;
  // Snapshot of the template's fields at the moment this request was sent —
  // editing the template later never changes an already-sent link.
  fields: GuestInfoField[];
  answers: GuestInfoAnswers | null;
  // The full guest-facing URL (admin-only view) — shown so staff can
  // copy/paste it manually (e.g. over WhatsApp) if the email doesn't land.
  link: string;
  expiresAt: string;
  submittedAt: string | null;
  createdAt: string;
}

// What the public, token-scoped page gets back — deliberately excludes the
// token/bookingId itself and any other booking fields not needed to render
// the form.
export interface BookingInfoRequestPublicView {
  status: BookingInfoRequestStatus;
  propertyName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  fields: GuestInfoField[];
  expiresAt: string;
}

export interface SubmitGuestInfoInput {
  answers: GuestInfoAnswers;
}

// --- Testimonials ---
//
// Not in API_DOCUMENTATION.md yet — spec'd in
// BACKEND_CHANGES_TESTIMONIALS.md. Public reads are per-site (each of
// components/italy/testimonials.tsx and components/sri-lanka/testimonials.tsx
// only ever renders its own site's reviews) and admin-manageable from a
// dedicated "Testimonials" tab, same site-tabbed shape as the Blog admin page.

export interface Testimonial {
  id: string;
  site: Site;
  name: string;
  role: string; // e.g. "Airbnb Guest · 3 nights" — freeform, matches today's hardcoded copy
  quote: string;
  rating: number; // 1–5
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialInput {
  site: Site;
  name: string;
  role: string;
  quote: string;
  rating: number;
  sortOrder?: number;
  active?: boolean;
}

export interface UpdateTestimonialInput {
  name?: string;
  role?: string;
  quote?: string;
  rating?: number;
  sortOrder?: number;
  active?: boolean;
}

// --- Heatmap ---
//
// Not in API_DOCUMENTATION.md yet — spec'd in
// BACKEND_CHANGES_HEATMAP_ANALYTICS.md. See src/lib/analytics/click-tracker.ts
// (the public-site data collector) and src/lib/api/heatmap.ts (the admin-side
// read calls).

export type HeatmapDevice = "all" | "desktop" | "tablet" | "mobile";

export interface HeatmapPageInfo {
  site: Site;
  path: string;
  label: string;
  clicks: number;
}

export interface HeatmapPoint {
  // A fraction (0–1) of the page's rendered width/height at the moment of
  // capture — resolution-independent, so a click recorded on one visitor's
  // screen still lands in the right spot when replayed over the admin's
  // preview iframe at a different pixel size.
  xPct: number;
  yPct: number;
  // How many raw clicks were folded into this point after grid bucketing —
  // never directly a pixel-for-pixel click.
  weight: number;
}

export interface HeatmapData {
  site: Site | null;
  path: string;
  device: HeatmapDevice;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  totalClicks: number;
  totalPageViews: number;
  // The hottest point's weight — every point's color/intensity when drawn is
  // normalized against this, same idea as Plerdy/Hotjar's overlays.
  maxWeight: number;
  points: HeatmapPoint[];
}

export interface ClickEventInput {
  site: Site | null;
  path: string;
  xPct: number;
  yPct: number;
  viewportWidth: number;
  device: Exclude<HeatmapDevice, "all">;
  sessionId: string;
  // Best-effort "tag#id.class" description of the clicked element, purely
  // for an optional "top clicked elements" list — never element text
  // content, which could be guest-entered PII.
  targetSelector?: string;
  occurredAt: string; // ISO timestamp, client clock
}
