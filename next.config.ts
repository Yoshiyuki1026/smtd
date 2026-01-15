import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

// Cloudflare Pages開発環境セットアップ
if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
