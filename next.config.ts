import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image only loads remote images from hosts you explicitly allow.
    // The sample listing photos are Unsplash placeholders — when you swap in
    // real photos (local files in /public or an MLS CDN), update this list.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Vercel Blob — where the sync re-hosts MLS Grid photos. Their
      // MediaURLs carry an `expires` stamp and die within the hour, so the
      // blob copy is the only URL that stays valid.
      { protocol: "https", hostname: "0omwen1zjkmnxamn.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
