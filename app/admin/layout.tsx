import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Manage IJWI-LEARN content including vocabulary, stories, levels, categories, difficulty levels, translation languages, learners, and chat.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
