import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    rules: {
      semi: ["error", "always"],
      // Desactivado: prohibía cualquier línea en blanco (max: 0) y marcaba error en el
      // editor en cada enter entre bloques. Para reactivar:
      // "no-multiple-empty-lines": ["error", { max: 0, maxEOF: 0, maxBOF: 0 }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "references/**",
    ".cursor/hooks/**",
    ".cursor/hooks/lib/**",
  ]),
]);

export default eslintConfig;
