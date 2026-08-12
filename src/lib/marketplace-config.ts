// Flat, island-wide delivery fee for COD orders (BACKEND_PLAN.md §7 — no
// per-zone shipping for launch). The backend trusts whatever `shippingFee`
// the client sends, so this is the frontend's single source of truth until
// an admin-configurable setting exists.
export const FLAT_SHIPPING_FEE = 5;
