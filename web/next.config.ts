import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The demo runs on the dev server: the «N» badge would cover «Back» and the CTAs at the bottom left.
  devIndicators: false,
  // Official PDFs are read from disk by /api/forms/pdf: make sure they ship with the function.
  outputFileTracingIncludes: { "/api/forms/pdf": ["./data/forms/**"] },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

export default nextConfig;
