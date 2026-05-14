import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ijwi-learn.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let levelRoutes: MetadataRoute.Sitemap = [];

  try {
    const { getAdminDb } = await import('@/db/firebaseAdmin');
    const adminDb = getAdminDb();
    const levelsSnap = await adminDb.collection('levels').orderBy('order').get();
    levelRoutes = levelsSnap.docs.map((doc) => {
      const slug = doc.data().slug || doc.data().title?.toLowerCase().replace(/\s+/g, '-');
      return {
        url: `${siteUrl}/learn/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });
  } catch {
    const fallbackSlugs = ['beginner', 'practice', 'intermediate', 'fluent'];
    levelRoutes = fallbackSlugs.map((slug) => ({
      url: `${siteUrl}/learn/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/videos`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/tests`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${siteUrl}/certificates`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${siteUrl}/chat`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${siteUrl}/leaderboard`, priority: 0.6, changeFrequency: 'daily' as const },
  ];

  return [...staticRoutes, ...levelRoutes];
}
