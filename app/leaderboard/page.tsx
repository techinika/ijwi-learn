import LeaderboardClient from './LeaderboardClient';

export const metadata = {
  title: 'Leaderboard - IJWI-LEARN',
  description: 'See the top learners on IJWI-LEARN leaderboard.',
};

export default function Page() {
  return <LeaderboardClient />;
}