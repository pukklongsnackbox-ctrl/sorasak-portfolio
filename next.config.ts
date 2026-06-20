import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    // !! สั่งให้ข้ามการแจ้งเตือน Error ของ TypeScript ตอน Build !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! สั่งให้ข้ามการแจ้งเตือน Error ของ ESLint ตอน Build !!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;