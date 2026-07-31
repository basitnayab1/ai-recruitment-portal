import type { NextConfig } from "next";

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
