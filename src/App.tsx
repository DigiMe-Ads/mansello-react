import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "@/components/marketplace/cart-provider";
import { ContentProvider } from "@/components/content-provider";
import { initClickHeatmapTracker } from "@/lib/analytics/click-tracker";

// --- Public pages -----------------------------------------------------------
import Home from "@/pages/page";

import ItalyHome from "@/pages/italy/page";
import ItalyAbout from "@/pages/italy/about/page";
import ItalyAirbnb from "@/pages/italy/airbnb/page";
import ItalyBlog from "@/pages/italy/blog/page";
import ItalyBlogPost from "@/pages/italy/blog/[slug]/page";
import ItalyDestination from "@/pages/italy/destinations/[slug]/page";
import ItalyBookingConfirmation from "@/pages/italy/booking/confirmation/page";
import ItalyContact from "@/pages/italy/contact/page";
import ItalyTerms from "@/pages/italy/terms/page";
import ItalyPrivacy from "@/pages/italy/privacy/page";

import SriLankaHome from "@/pages/sri-lanka/page";
import SriLankaAbout from "@/pages/sri-lanka/about/page";
import SriLankaAirbnb from "@/pages/sri-lanka/airbnb/page";
import SriLankaBlog from "@/pages/sri-lanka/blog/page";
import SriLankaBlogPost from "@/pages/sri-lanka/blog/[slug]/page";
import SriLankaBookingConfirmation from "@/pages/sri-lanka/booking/confirmation/page";
import SriLankaContact from "@/pages/sri-lanka/contact/page";
import SriLankaTransport from "@/pages/sri-lanka/transport/page";
import SriLankaTourPackage from "@/pages/sri-lanka/transport/packages/[slug]/page";
import SriLankaDestination from "@/pages/sri-lanka/destinations/[slug]/page";
import SriLankaTerms from "@/pages/sri-lanka/terms/page";
import SriLankaPrivacy from "@/pages/sri-lanka/privacy/page";

import Marketplace from "@/pages/sri-lanka/marketplace/page";
import MarketplaceCart from "@/pages/sri-lanka/marketplace/cart/page";
import MarketplaceCheckout from "@/pages/sri-lanka/marketplace/checkout/page";
import MarketplaceOrder from "@/pages/sri-lanka/marketplace/order/[id]/page";

import BookingInfo from "@/pages/booking-info/[token]/page";

// --- Admin ------------------------------------------------------------------
// Lazy-loaded, deliberately. These 13 screens are only ever reached by staff,
// but a static import pulls the whole dashboard — heatmap viewer, rate editor,
// form builder, user management — into the single entry chunk that every
// public visitor downloads and parses. Splitting them out keeps that weight
// off the guest-facing pages, where it was hurting Core Web Vitals.
const AdminLogin = lazy(() => import("@/pages/admin/login/page"));
const ProtectedAdminLayout = lazy(() => import("@/pages/admin/protected-layout"));
const AdminDashboard = lazy(() => import("@/pages/admin/(protected)/dashboard/page"));
const AdminVillas = lazy(() => import("@/pages/admin/(protected)/villas/page"));
const AdminVillaDetail = lazy(() => import("@/pages/admin/(protected)/villas/[propertyId]/page"));
const AdminProducts = lazy(() => import("@/pages/admin/(protected)/marketplace/products/page"));
const AdminOrders = lazy(() => import("@/pages/admin/(protected)/marketplace/orders/page"));
const AdminLeads = lazy(() => import("@/pages/admin/(protected)/leads/page"));
const AdminBlog = lazy(() => import("@/pages/admin/(protected)/blog/page"));
const AdminTestimonials = lazy(() => import("@/pages/admin/(protected)/testimonials/page"));
const AdminContent = lazy(() => import("@/pages/admin/(protected)/content/page"));
const AdminGuestInfoForm = lazy(() => import("@/pages/admin/(protected)/settings/guest-info-form/page"));
const AdminUsers = lazy(() => import("@/pages/admin/(protected)/users/page"));
const AdminHeatmap = lazy(() => import("@/pages/admin/(protected)/heatmap/page"));


// Restore Next's default behaviour of scrolling to the top on navigation —
// except when the destination carries a hash (e.g. a package page's
// "Enquire About This Package" linking to `#transfer-request-form`), in
// which case the whole point is to land on that section, not the top.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// Starts the public-site click collector that feeds the admin Heatmap tab —
// see src/lib/analytics/click-tracker.ts. Mounted once, here, rather than in
// every individual page.
function ClickHeatmapTracker() {
  useEffect(() => {
    initClickHeatmapTracker();
  }, []);
  return null;
}

export default function App() {
  return (
    <ContentProvider>
      <CartProvider>
        <ScrollToTop />
        <ClickHeatmapTracker />
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Italy */}
          <Route path="/italy" element={<ItalyHome />} />
          <Route path="/italy/about" element={<ItalyAbout />} />
          <Route path="/italy/airbnb" element={<ItalyAirbnb />} />
          <Route path="/italy/blog" element={<ItalyBlog />} />
          <Route path="/italy/blog/:slug" element={<ItalyBlogPost />} />
          <Route path="/italy/destinations/:slug" element={<ItalyDestination />} />
          <Route path="/italy/booking/confirmation" element={<ItalyBookingConfirmation />} />
          <Route path="/italy/contact" element={<ItalyContact />} />
          <Route path="/italy/terms" element={<ItalyTerms />} />
          <Route path="/italy/privacy" element={<ItalyPrivacy />} />

          {/* Sri Lanka */}
          <Route path="/sri-lanka" element={<SriLankaHome />} />
          <Route path="/sri-lanka/about" element={<SriLankaAbout />} />
          <Route path="/sri-lanka/airbnb" element={<SriLankaAirbnb />} />
          <Route path="/sri-lanka/blog" element={<SriLankaBlog />} />
          <Route path="/sri-lanka/blog/:slug" element={<SriLankaBlogPost />} />
          <Route path="/sri-lanka/booking/confirmation" element={<SriLankaBookingConfirmation />} />
          <Route path="/sri-lanka/contact" element={<SriLankaContact />} />
          <Route path="/sri-lanka/transport" element={<SriLankaTransport />} />
          <Route path="/sri-lanka/transport/packages/:slug" element={<SriLankaTourPackage />} />
          <Route path="/sri-lanka/destinations/:slug" element={<SriLankaDestination />} />
          <Route path="/sri-lanka/terms" element={<SriLankaTerms />} />
          <Route path="/sri-lanka/privacy" element={<SriLankaPrivacy />} />

          {/* Sri Lanka marketplace */}
          <Route path="/sri-lanka/marketplace" element={<Marketplace />} />
          <Route path="/sri-lanka/marketplace/cart" element={<MarketplaceCart />} />
          <Route path="/sri-lanka/marketplace/checkout" element={<MarketplaceCheckout />} />
          <Route path="/sri-lanka/marketplace/order/:id" element={<MarketplaceOrder />} />

          {/* Guest booking info */}
          <Route path="/booking-info/:token" element={<BookingInfo />} />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<div className="min-h-screen bg-[#F7F5F0]" />}>
                <AdminLogin />
              </Suspense>
            }
          />
          <Route
            element={
              <Suspense fallback={<div className="min-h-screen bg-[#F7F5F0]" />}>
                <ProtectedAdminLayout />
              </Suspense>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/villas" element={<AdminVillas />} />
            <Route path="/admin/villas/:propertyId" element={<AdminVillaDetail />} />
            <Route path="/admin/marketplace/products" element={<AdminProducts />} />
            <Route path="/admin/marketplace/orders" element={<AdminOrders />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/testimonials" element={<AdminTestimonials />} />
          <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/settings/guest-info-form" element={<AdminGuestInfoForm />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/heatmap" element={<AdminHeatmap />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </ContentProvider>
  );
}
