import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // !! เพิ่มบรรทัดนี้เข้าไปเพื่อให้โหลด CSS ได้ครับ !!
  basePath: '/sorasak-portfolio',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;