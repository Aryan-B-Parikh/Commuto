import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "darkify.js",
  ]),
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      // Downgrade to warn — a full type-safety pass is a separate task
      "@typescript-eslint/no-explicit-any": "warn",
      // React Compiler static analysis — downgrade to warn for production readiness
      "react-compiler/react-compiler": "warn",
      // React Hooks v5+ strict rules — valid patterns flagged (WebSocket reconnect, countdown timers)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      // Prefix unused vars with _ to suppress; allow unused catch params
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;

