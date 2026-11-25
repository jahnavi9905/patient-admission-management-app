import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration - the React plugin enables JSX support.
// In local development the dev server proxies /api to the Flask backend,
// so the frontend code can always call the relative path "/api".
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
