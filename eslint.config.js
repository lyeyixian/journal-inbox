import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

// Dependencies point inward only. Each layer lists the layers it must not reach.
const forbid = (layers, message) =>
  layers.map((layer) => ({
    regex: `(^|/)${layer}(/|$)`,
    message,
  }));

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...forbid(
              ["application", "infrastructure", "entrypoints"],
              "Domain imports nothing outside src/domain.",
            ),
            {
              regex: "^[^.]",
              message: "Domain imports no packages and no Node built-ins.",
            },
          ],
        },
      ],
    },
  },
  {
    // Tests may import vitest, but the layer boundaries still hold.
    files: ["src/domain/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            ["application", "infrastructure", "entrypoints"],
            "Domain imports nothing outside src/domain.",
          ),
        },
      ],
    },
  },
  {
    files: ["src/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            ["infrastructure", "entrypoints"],
            "Application imports domain only.",
          ),
        },
      ],
    },
  },
  {
    files: ["src/infrastructure/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            ["entrypoints"],
            "Infrastructure never imports entrypoints.",
          ),
        },
      ],
    },
  },
  prettier,
);
