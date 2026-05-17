import { dbService, Level, UserProfile } from '@/lib/database';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Leaderboard - IJWI-LEARN',
  description: 'See the top learners on IJWI-LEARN leaderboard.',
};

export default async function LeaderboardPage() {
  try {
    const [users, dbLevels] = await Promise.all([
      dbService.getUsers(),
      dbService.getLevels(),
    ]);

    return (
      <LeaderboardClient
        initialLeaderboard={users as UserProfile[]}
        initialLevels={dbLevels as Level[]}
      />
    );
  } catch (error) {
    return (
      <LeaderboardClient
        initialLeaderboard={[]}
        initialLevels={[]}
      />
    );
  }
}