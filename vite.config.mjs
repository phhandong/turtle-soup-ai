import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const fcApiUrl =
  process.env.FC_API_URL ??
  "https://turtle-ai-proxy-opzmtticwv.cn-wulanchabu.fcapp.run";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    proxy: {
      "/api": {
        target: fcApiUrl,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    allowedHosts: ['turtle.handong-joy.xyz'],
  },
});
