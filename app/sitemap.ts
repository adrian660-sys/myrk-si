import type { MetadataRoute } from "next";

const SITE = "https://myrk.si";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${SITE}/`,         lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE}/work`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/notebook`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
