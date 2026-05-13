import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ijwi-learn.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/learn', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/learn/beginner', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/learn/practice', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/learn/intermediate', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/learn/fluent', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/videos', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/tests', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/certificates', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/chat', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/leaderboard', priority: 0.6, changeFrequency: 'daily' as const },
  ];

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
