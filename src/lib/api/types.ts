export type StripeAccountRef = "italy" | "sri_lanka";

export interface PricingTier {
  id: string;
  propertyId: string;
  guestCount: number;
  rooms: number;
  pricePerNight: string;
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
  // City/tourist tax config — currently only Bologna's has this enabled.
  // Optional so a property from a not-yet-updated backend simply reads as
  // "no tax", not undefined/crashing.
  cityTaxEnabled?: boolean;
  cityTaxMaxNights?: number; // tax stops accruing after this many nights of a stay
  cityTaxExemptAgeUnder?: number; // guests younger than this pay no tax
  cityTaxBands?: CityTaxBand[];
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
  // accommodationPrice + cityTax = totalPrice (the amount actually charged).
  // accommodationPrice/cityTax are optional so a booking from a
  // not-yet-updated backend still renders — falls back to showing just
  // totalPrice with no breakdown.
  accommodationPrice?: string;
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
  // How many of `guests` are under the property's cityTaxExemptAgeUnder
  // (14, for Bologna) — exempt from city tax. Ignored server-side for
  // properties with cityTaxEnabled: false.
  childrenUnder14?: number;
}

export interface CreateBookingResponse {
  booking: Booking;
  clientSecret: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
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
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  priceUsd?: number;
  images?: string[];
  active?: boolean;
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
}

export interface UpdatePropertyInput {
  minNights?: number;
  turnoverBufferDays?: number;
  checkInTime?: string;
  checkOutTime?: string;
  airbnbIcalImportUrls?: string[];
}

export interface UpdatePricingTierInput {
  guestCount: number;
  rooms?: number;
  pricePerNight: number;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
}

// --- Leads ---

export type LeadStatus = "new" | "read" | "responded";
export type ContactSubject = "room_booking" | "airport_transfer" | "marketplace" | "other";
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferInput {
  propertyId: string;
  title: string;
  discountPercent: number;
  imageUrl?: string;
  active?: boolean;
}

export interface UpdateOfferInput {
  title?: string;
  discountPercent?: number;
  imageUrl?: string;
  active?: boolean;
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
