import { NextConfig } from "next";

// Dynamic image domains configuration for MinIO
function getImageDomains() {
  const domains = [
    // Default localhost for development
    {
      protocol: "http" as const,
      hostname: "localhost",
      port: "9000",
      pathname: "/**",
    },
    // AWS S3 compatibility
    {
      protocol: "https" as const,
      hostname: "*.amazonaws.com",
    },
  ];

  // Add VPS domain if configured
  if (process.env.DOMAIN) {
    domains.push({
      protocol: "http" as const,
      hostname: process.env.DOMAIN,
      port: "9000",
      pathname: "/**",
    });
  }

  // Add VPS IP if configured
  if (process.env.VPS_IP) {
    domains.push({
      protocol: "http" as const,
      hostname: process.env.VPS_IP,
      port: "9000",
      pathname: "/**",
    });
    domains.push({
      protocol: "https" as const,
      hostname: process.env.VPS_IP,
    });
  }

  // Add custom MinIO public endpoint if configured
  if (process.env.MINIO_PUBLIC_ENDPOINT) {
    try {
      const url = new URL(process.env.MINIO_PUBLIC_ENDPOINT);
      if (url.protocol === "http:") {
        domains.push({
          protocol: "http",
          hostname: url.hostname,
          port: url.port || "80",
          pathname: "/**",
        });
      } else if (url.protocol === "https:") {
        domains.push({
          protocol: "https",
          hostname: url.hostname,
        });
      }
    } catch (error) {
      console.warn(
        "Invalid MINIO_PUBLIC_ENDPOINT URL:",
        process.env.MINIO_PUBLIC_ENDPOINT
      );
    }
  }

  return domains;
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: getImageDomains(),
  },
};

export default nextConfig;
