import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// Vite 8 runs on the native Rolldown pipeline. Rolldown-specific options live
// under build.rolldownOptions and should only be added when a measured need
// exists (chunking, module-level optimization). None are justified yet.
export default defineConfig({
  plugins: [
    react(),
    // Vite 8 / plugin-react 6 opt-in path for the stable React Compiler.
    // Only src React modules match the preset; domain and renderer code stay
    // outside ordinary React compilation.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@domain": fileURLToPath(new URL("./convex/domain", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {},
    // Measured after lazy-loading the 3D field and document exporters. The
    // remaining largest chunk is Three's optional WebGPU renderer (568 kB),
    // which Rolldown cannot split below its module boundary.
    chunkSizeWarningLimit: 600,
  },
});
