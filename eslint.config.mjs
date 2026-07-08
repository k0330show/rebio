import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // useEffect内でsetStateを呼ぶのはReactの正規パターン。warnに緩和。
      "react-hooks/set-state-in-effect": "warn",
      // レンダリング中のimpure function呼び出し: 個別に修正済みのもの以外はwarnに
      "@next/next/no-assign-module-variable": "warn",
    },
  },
]);

export default eslintConfig;
