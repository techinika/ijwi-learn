import { NextResponse } from 'next/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ijwi-learn.vercel.app';

const pages = [
  { path: '/', title: 'IJWI-LEARN - Learn Kinyarwanda', desc: 'The modern way to learn Kinyarwanda. From basics to fluency, at your own pace.' },
  { path: '/learn/beginner', title: 'Beginner Level - Vocabulary', desc: 'Learn basic Kinyarwanda vocabulary, phrases, and numbers with interactive flashcards.' },
  { path: '/learn/practice', title: 'Practice Level - AI Conversation', desc: 'Practice Kinyarwanda conversations with AI-powered scenarios.' },
  { path: '/learn/intermediate', title: 'Intermediate Level - Grammar', desc: 'Master Kinyarwanda grammar, verb conjugation, noun classes, and sentence structure.' },
  { path: '/learn/fluent', title: 'Fluent Level - Stories', desc: 'Read Kinyarwanda stories to improve your reading comprehension.' },
  { path: '/videos', title: 'Video Lessons', desc: 'Learn Kinyarwanda through engaging video content from native speakers.' },
  { path: '/tests', title: 'Level Tests', desc: 'Test your Kinyarwanda knowledge and earn certificates with an 80% pass rate.' },
  { path: '/certificates', title: 'Your Certificates', desc: 'View and download your earned Kinyarwanda language certificates.' },
  { path: '/leaderboard', title: 'Leaderboard', desc: 'See how you rank against other Kinyarwanda learners.' },
  { path: '/chat', title: 'Teacher Chat', desc: 'Get help from experienced Kinyarwanda teachers.' },
];

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export async function GET() {
  const items = pages.map((page) => `
    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${siteUrl}${page.path}</link>
      <description>${escapeXml(page.desc)}</description>
      <guid>${siteUrl}${page.path}</guid>
    </item>
  `).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IJWI-LEARN - Learn Kinyarwanda</title>
    <link>${siteUrl}</link>
    <description>Master the Kinyarwanda language with interactive lessons, videos, tests, and more.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
