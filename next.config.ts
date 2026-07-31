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

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: getSupabaseImageRemotePatterns(),
  },
};

export default nextConfig;
