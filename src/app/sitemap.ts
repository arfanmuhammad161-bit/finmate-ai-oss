import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://finmate-ai-brown.vercel.app";
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/landing`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
