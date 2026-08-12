import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars. We accept both the Vite-idiomatic VITE_* names and the
  // original Next NEXT_PUBLIC_* names so existing .env values keep working.
  const env = loadEnv(mode, process.cwd(), "");

  const pick = (...keys: string[]) => {
    for (const k of keys) if (env[k]) return env[k];
    return "";
  };

  const API_URL = pick("VITE_API_URL", "NEXT_PUBLIC_API_URL");
  const STRIPE_PK_ITALY = pick("VITE_STRIPE_PK_ITALY", "NEXT_PUBLIC_STRIPE_PK_ITALY");
  const STRIPE_PK_SRILANKA = pick("VITE_STRIPE_PK_SRILANKA", "NEXT_PUBLIC_STRIPE_PK_SRILANKA");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        // Shims so components that still import from `next/*` keep working
        // without edits. These map the handful of Next primitives this app
        // used onto plain React / React Router equivalents.
        "next/image": path.resolve(__dirname, "src/shims/next-image.tsx"),
        "next/link": path.resolve(__dirname, "src/shims/next-link.tsx"),
        "next/navigation": path.resolve(__dirname, "src/shims/next-navigation.ts"),
        "next/dynamic": path.resolve(__dirname, "src/shims/next-dynamic.tsx"),
      },
    },
    // The original code reads config via `process.env.NEXT_PUBLIC_*`. Replace
    // those references at build time so no source edits are needed. Values come
    // from .env (VITE_* preferred, NEXT_PUBLIC_* also accepted).
    define: {
      "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(API_URL),
      "process.env.NEXT_PUBLIC_STRIPE_PK_ITALY": JSON.stringify(STRIPE_PK_ITALY),
      "process.env.NEXT_PUBLIC_STRIPE_PK_SRILANKA": JSON.stringify(STRIPE_PK_SRILANKA),
    },
    build: {
      outDir: "dist",
    },
  };
});
