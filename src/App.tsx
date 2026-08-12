import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "@/components/marketplace/cart-provider";

// --- Public pages -----------------------------------------------------------
import Home from "@/pages/page";

import ItalyHome from "@/pages/italy/page";
import ItalyAbout from "@/pages/italy/about/page";
import ItalyAirbnb from "@/pages/italy/airbnb/page";
import ItalyBlog from "@/pages/italy/blog/page";
import ItalyBlogPost from "@/pages/italy/blog/[slug]/page";
import ItalyBookingConfirmation from "@/pages/italy/booking/confirmation/page";
import ItalyContact from "@/pages/italy/contact/page";
import ItalyTransport from "@/pages/italy/transport/page";

import SriLankaHome from "@/pages/sri-lanka/page";
import SriLankaAbout from "@/pages/sri-lanka/about/page";
import SriLankaAirbnb from "@/pages/sri-lanka/airbnb/page";
import SriLankaBlog from "@/pages/sri-lanka/blog/page";
import SriLankaBlogPost from "@/pages/sri-lanka/blog/[slug]/page";
import SriLankaBookingConfirmation from "@/pages/sri-lanka/booking/confirmation/page";
import SriLankaContact from "@/pages/sri-lanka/contact/page";
import SriLankaTransport from "@/pages/sri-lanka/transport/page";
import SriLankaTourPackage from "@/pages/sri-lanka/transport/packages/[slug]/page";

import Marketplace from "@/pages/sri-lanka/marketplace/page";
import MarketplaceCart from "@/pages/sri-lanka/marketplace/cart/page";
import MarketplaceCheckout from "@/pages/sri-lanka/marketplace/checkout/page";
import MarketplaceOrder from "@/pages/sri-lanka/marketplace/order/[id]/page";

import BookingInfo from "@/pages/booking-info/[token]/page";

// --- Admin ------------------------------------------------------------------
import AdminLogin from "@/pages/admin/login/page";
import ProtectedAdminLayout from "@/pages/admin/protected-layout";
import AdminDashboard from "@/pages/admin/(protected)/dashboard/page";
import AdminVillas from "@/pages/admin/(protected)/villas/page";
import AdminVillaDetail from "@/pages/admin/(protected)/villas/[propertyId]/page";
import AdminProducts from "@/pages/admin/(protected)/marketplace/products/page";
import AdminOrders from "@/pages/admin/(protected)/marketplace/orders/page";
import AdminLeads from "@/pages/admin/(protected)/leads/page";
import AdminBlog from "@/pages/admin/(protected)/blog/page";
import AdminGuestInfoForm from "@/pages/admin/(protected)/settings/guest-info-form/page";
import AdminUsers from "@/pages/admin/(protected)/users/page";

// Restore Next's default behaviour of scrolling to the top on navigation.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <CartProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Italy */}
        <Route path="/italy" element={<ItalyHome />} />
        <Route path="/italy/about" element={<ItalyAbout />} />
        <Route path="/italy/airbnb" element={<ItalyAirbnb />} />
        <Route path="/italy/blog" element={<ItalyBlog />} />
        <Route path="/italy/blog/:slug" element={<ItalyBlogPost />} />
        <Route path="/italy/booking/confirmation" element={<ItalyBookingConfirmation />} />
        <Route path="/italy/contact" element={<ItalyContact />} />
        <Route path="/italy/transport" element={<ItalyTransport />} />

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

        {/* Sri Lanka marketplace */}
        <Route path="/sri-lanka/marketplace" element={<Marketplace />} />
        <Route path="/sri-lanka/marketplace/cart" element={<MarketplaceCart />} />
        <Route path="/sri-lanka/marketplace/checkout" element={<MarketplaceCheckout />} />
        <Route path="/sri-lanka/marketplace/order/:id" element={<MarketplaceOrder />} />

        {/* Guest booking info */}
        <Route path="/booking-info/:token" element={<BookingInfo />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedAdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/villas" element={<AdminVillas />} />
          <Route path="/admin/villas/:propertyId" element={<AdminVillaDetail />} />
          <Route path="/admin/marketplace/products" element={<AdminProducts />} />
          <Route path="/admin/marketplace/orders" element={<AdminOrders />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/settings/guest-info-form" element={<AdminGuestInfoForm />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  );
}
