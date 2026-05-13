import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tests & Assessments',
  description: 'Test your Kinyarwanda knowledge with level-based assessments. Each test has 10 random questions. Score 80% or higher to pass and earn certificates.',
  openGraph: {
    title: 'Kinyarwanda Level Tests | IJWI-LEARN',
    description: 'Take level-based Kinyarwanda tests, track your streak, and earn certificates when you score 80% or higher.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
