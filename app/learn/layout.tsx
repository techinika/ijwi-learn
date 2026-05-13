import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn Kinyarwanda',
  description: 'Choose your learning path. From beginner vocabulary to fluent story reading, IJWI-LEARN has four progressive levels to take you from zero to confident Kinyarwanda speaker.',
  openGraph: {
    title: 'Kinyarwanda Learning Levels | IJWI-LEARN',
    description: 'Start at Beginner (free) and progress through Practice, Intermediate, and Fluent levels.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
