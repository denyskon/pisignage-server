import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const user = process.env.PISIGNAGE_USER || "pi";
const password = process.env.PISIGNAGE_PASSWORD || "pi";
const authorization = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

const authenticatedProxy = {
  target: "http://localhost:3000",
  changeOrigin: true,
  headers: { authorization },
};

export default defineConfig({
  plugins: [vue()],
  base: "/",
  build: {
    outDir: "../public",
    emptyOutDir: true,
    assetsDir: "assets",
  },
  server: {
    port: 5173,
    proxy: {
      "/api": authenticatedProxy,
      "/media": authenticatedProxy,
    },
  },
});
