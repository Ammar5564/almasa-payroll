import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // App is hosted at site root when embedded in Spring Boot (classpath:/static/)
  base: "/",
  server: {
    host: "::",
    // Dev UI port — Spring Boot serves the embedded app on 8081 (see application.properties).
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
