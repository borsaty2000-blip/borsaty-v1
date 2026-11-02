import { MetadataRoute } from "next";
import { PRIORITY_STOCKS } from "@borsaty/shared";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://borsatyai.com";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/screener`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/signals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/calendar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/docs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/status`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.5 },
  ];

  // Dynamic priority stock routes
  const stockRoutes: MetadataRoute.Sitemap = PRIORITY_STOCKS.map((stk) => ({
    url: `${baseUrl}/stock/${stk.symbol}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...stockRoutes];
}
