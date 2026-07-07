import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake barrel imports from large icon/UI packages so only the
  // components actually used ship to the client.
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
};

export default nextConfig;
