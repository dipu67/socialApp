import { NextConfig } from "next";

// Dynamic image domains configuration for R2 and MinIO
function getImageDomains() {
  const domains = [
    // Default localhost for development (MinIO)
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
    // Cloudflare R2 domains
    {
      protocol: "https" as const,
      hostname: "*.r2.cloudflarestorage.com",
    },
  ];

  // Add R2 custom domain if configured
  if (process.env.R2_PUBLIC_URL) {
    try {
      const url = new URL(process.env.R2_PUBLIC_URL);
      if (url.protocol === "https:") {
        domains.push({
          protocol: "https" as const,
          hostname: url.hostname,
        });
      } else if (url.protocol === "http:") {
        domains.push({
          protocol: "http" as const,
          hostname: url.hostname,
          port: url.port || "80",
          pathname: "/**",
        });
      }
    } catch (error) {
      console.warn("Invalid R2_PUBLIC_URL:", process.env.R2_PUBLIC_URL);
    }
  }

  // Add R2 account-specific domain if account ID is configured
  if (process.env.R2_ACCOUNT_ID) {
    domains.push({
      protocol: "https" as const,
      hostname: `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });
  }

  // Backward compatibility - Add VPS domain if configured
  if (process.env.DOMAIN) {
    domains.push({
      protocol: "http" as const,
      hostname: process.env.DOMAIN,
      port: "9000",
      pathname: "/**",
    });
  }

  // Backward compatibility - Add VPS IP if configured
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

  return domains;
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: getImageDomains(),
  },
};

export default nextConfig;
