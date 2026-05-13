import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Chat',
  description: 'Get personalized help from experienced Kinyarwanda teachers. Ask questions about vocabulary, grammar, pronunciation, and more.',
  openGraph: {
    title: 'Kinyarwanda Teacher Chat | IJWI-LEARN',
    description: 'Connect with Kinyarwanda teachers for personalized language learning support.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
