import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: { port: 5173 },
    build: {
        // antd seul dépasse la limite par défaut (500 ko)
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                // Découpage des grosses dépendances pour un chargement plus rapide
                manualChunks: {
                    react: ["react", "react-dom", "react-router-dom"],
                    antd: ["antd", "@ant-design/icons"],
                    charts: ["recharts"],
                },
            },
        },
    },
});
