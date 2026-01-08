import { nodeResolve } from "@rollup/plugin-node-resolve";
export default {
  input: "./local/editor.js",
  output: {
    file: "./local/dist/editor.bundle.js",
    format: "iife",
    compact: true,
  },
  plugins: [nodeResolve()],
};
