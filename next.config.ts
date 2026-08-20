import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "preview-chat-a1884aad-bd57-46f7-a858-33fa6ba6d8d7.space-z.ai",
  ],
  serverExternalPackages: ["@prisma/client", "@prisma/engines"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
