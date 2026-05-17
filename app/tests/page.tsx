import { dbService, Level, Test } from '@/lib/database';
import TestsClient from './TestsClient';

export const metadata = {
  title: 'Tests - IJWI-LEARN',
  description: 'Test your Kinyarwanda knowledge with interactive quizzes.',
};

export default async function TestsPage() {
  try {
    const [dbTests, dbLevels] = await Promise.all([
      dbService.getTests(),
      dbService.getLevels(),
    ]);

    return (
      <TestsClient
        initialTests={dbTests as Test[]}
        initialLevels={dbLevels as Level[]}
      />
    );
  } catch {
    return <TestsClient initialTests={[]} initialLevels={[]} />;
  }
}