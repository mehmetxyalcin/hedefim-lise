import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
];

if (supabaseUrl) {
  const { hostname } = new URL(supabaseUrl);
  remotePatterns.push({
    protocol: "https",
    hostname,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // Vercel görsel optimize kotası dolduğunda /_next/image 402 döndürerek
    // sağlam Supabase görsellerini kırık gösteriyor. Dosyaları doğrudan sun.
    unoptimized: true,
  },
};

export default nextConfig;
