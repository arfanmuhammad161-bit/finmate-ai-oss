import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://finmate-ai-brown.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/login", "/register", "/forgot-password"],
        disallow: ["/dashboard", "/admin", "/api", "/reset-password"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
