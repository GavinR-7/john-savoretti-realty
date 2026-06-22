import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image only loads remote images from hosts you explicitly allow.
    // The sample listing photos are Unsplash placeholders — when you swap in
    // real photos (local files in /public or an MLS CDN), update this list.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
