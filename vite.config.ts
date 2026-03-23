import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	server: {
		headers: {
			// FFmpeg.wasm에 필요한 SharedArrayBuffer 지원 헤더
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "credentialless",
		},
	},
});
