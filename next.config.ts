import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      ...["/dashboard/:path*", "/current-affairs/:path*", "/exam-alerts/:path*", "/learn/:path*", "/notes/:path*", "/progress/:path*", "/settings/:path*", "/study-plan/:path*", "/syllabus/:path*"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" }],
      })),
    ];
  },
};

export default nextConfig;
