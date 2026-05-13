import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beginner Level',
  description: 'Start your Kinyarwanda journey with basic vocabulary, common phrases, and numbers. Interactive flashcards make learning fun and effective.',
  openGraph: {
    title: 'Beginner Kinyarwanda - Vocabulary & Phrases | IJWI-LEARN',
    description: 'Learn essential Kinyarwanda vocabulary, common phrases, and numbers with interactive flashcards.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
