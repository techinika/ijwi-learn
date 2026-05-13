import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Lessons',
  description: 'Learn Kinyarwanda through engaging video lessons. Watch content organized by proficiency level - from beginner greetings to advanced cultural insights.',
  openGraph: {
    title: 'Kinyarwanda Video Lessons | IJWI-LEARN',
    description: 'Watch engaging Kinyarwanda video lessons organized by level - Beginner through Fluent.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
