import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Level',
  description: 'Practice Kinyarwanda conversations with AI-powered scenarios. Simulate real-life situations like greetings, ordering food, shopping, and asking for directions.',
  openGraph: {
    title: 'Practice Kinyarwanda Conversations | IJWI-LEARN',
    description: 'Practice real-world Kinyarwanda conversations with AI-powered scenarios at a restaurant, market, and more.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
