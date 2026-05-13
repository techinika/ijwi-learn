import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'See how you rank against other Kinyarwanda learners. Compete in overall points, vocabulary learned, tests completed, and practice streaks.',
  openGraph: {
    title: 'Kinyarwanda Learner Leaderboard | IJWI-LEARN',
    description: 'Track your ranking against other Kinyarwanda learners in points, vocabulary, tests, and streaks.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
