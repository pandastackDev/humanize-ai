// import oxlint from "eslint-plugin-oxlint";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import onlyWarn from "eslint-plugin-only-warn";
import reactCompiler from "eslint-plugin-react-compiler";
import turboPlugin from "eslint-plugin-turbo";
// import pluginReact from "eslint-plugin-react";
// import pluginReactHooks from "eslint-plugin-react-hooks";

/**
 * A custom ESLint configuration for libraries that use Expo.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = defineConfig([
  js.configs.recommended,
  globalIgnores(["dist/*", "**/.expo", "**/node_modules"]),
  expoConfig,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  reactCompiler.configs.recommended,
  {
    rules: {
      "react/no-unknown-property": "error",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "off",
      "react/no-this-in-sfc": "error",
      "react/no-unescaped-entities": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='useMemo'], CallExpression[callee.property.name='useMemo']",
          message: "Avoid useMemo",
        },
        {
          selector:
            "CallExpression[callee.name='useCallback'], CallExpression[callee.property.name='useCallback']",
          message: "Avoid useCallback",
        },
        {
          selector:
            "CallExpression[callee.name='memo'], CallExpression[callee.property.name='memo']",
          message: "Avoid memo",
        },
        {
          selector:
            "CallExpression[callee.name='forwardRef'], CallExpression[callee.property.name='forwardRef']",
          message: "Avoid forwardRef",
        },
        {
          selector:
            "CallExpression[callee.name='useContext'], CallExpression[callee.property.name='useContext']",
          message: "Use the 'use' hook instead of useContext",
        },
      ],
    },
  },
  // ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),

  // globalIgnores([
  //   // Default ignores of eslint-config-next:
  //   ".next/**",
  //   "out/**",
  //   "build/**",
  //   "next-env.d.ts",
  // ]),
  //   rules: {
  //     ...pluginReactHooks.configs.recommended.rules,
  //     // React scope no longer necessary with new JSX transform.
  //     "react/react-in-jsx-scope": "off",
  //   },
  // },
]);
