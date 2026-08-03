import type { NextConfig } from "next";

const REQUIRED_VERCEL_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

function assertVercelSupabaseEnv(): void {
  if (process.env.VERCEL !== "1") {
    return;
  }

  const missing = REQUIRED_VERCEL_ENV.filter((name) => !process.env[name]?.trim());
  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `[Vercel build] Missing required environment variables: ${missing.join(", ")}. ` +
      "Add them in Vercel → Project → Settings → Environment Variables " +
      "(Production, Preview, and Development), then redeploy."
  );
}

assertVercelSupabaseEnv();

function getSupabaseImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return [];
  }

  try {
    const { hostname } = new URL(supabaseUrl);
    return [
      {
        protocol: "https",
        hostname,
        pathname: "/storage/v1/object/**",
      },
    ];
  } catch {
    return [];
  }
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["framer-motion"],
    // Allow larger profile-picture FormData so compression can run server-side.
    // App still enforces a 1 MB limit on the final processed image before Supabase.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: getSupabaseImageRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
