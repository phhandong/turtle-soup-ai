import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const fcApiUrl = loadEnv(mode, process.cwd(), '').FC_API_URL ??
    "https://turtle-ai-proxy-opzmtticwv.cn-wulanchabu.fcapp.run";

  return {
    plugins: [react()],
    base: process.env.VITE_BASE_PATH ?? "/",
    server: {
      proxy: {
        "/api": {
          target: fcApiUrl || 'http://127.0.0.1:4173',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      allowedHosts: ['turtle.handong-joy.xyz'],
    },
  };
});
