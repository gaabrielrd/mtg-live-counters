import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "server/index": "src/server/index.ts"
  },
  clean: true,
  dts: true,
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: true,
  outDir: "dist",
  external: ["node:http", "node:url", "node:crypto"]
});
