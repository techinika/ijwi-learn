import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intermediate Level',
  description: 'Master Kinyarwanda grammar including verb conjugation, noun classes, adjectives, and sentence structure. Take your language skills to the next level.',
  openGraph: {
    title: 'Intermediate Kinyarwanda Grammar | IJWI-LEARN',
    description: 'Deepen your Kinyarwanda knowledge with verb conjugation, noun classes, adjectives, and sentence structure lessons.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
