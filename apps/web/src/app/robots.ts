import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://borsatyai.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/admin", "/api/admin/*", "/__clerk/*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
