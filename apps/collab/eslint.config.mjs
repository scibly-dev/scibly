import nextConfig from "@scibly/eslint-config/next";

const config = [
  {
    ignores: ["dist/**"]
  },
  ...nextConfig
];

export default config;
