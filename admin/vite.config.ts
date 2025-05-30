import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_API_URL || "http://localhost:5000";

  return {
    root: path.resolve(__dirname),
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backend,
          changeOrigin: true,
          secure: false,
        },
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "../shared"),
        "@assets": path.resolve(__dirname, "../attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "../dist/public/admin"),
      emptyOutDir: false,
    },
  };
});
