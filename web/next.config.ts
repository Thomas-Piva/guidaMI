import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Official PDFs are read from disk by /api/forms/pdf: make sure they ship with the function.
  outputFileTracingIncludes: { "/api/forms/pdf": ["./data/forms/**"] },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
};

export default nextConfig;
