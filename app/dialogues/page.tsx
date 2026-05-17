import { dbService, Level, Difficulty, Dialogue } from '@/lib/database';
import DialoguesClient from './DialoguesClient';

export const metadata = {
  title: 'Dialogues - IJWI-LEARN',
  description: 'Practice real conversations in Kinyarwanda with interactive dialogues.',
};

export default async function DialoguesPage() {
  try {
    const [dbDialogues, dbLevels, dbDifficulties] = await Promise.all([
      dbService.getDialogues({ isActive: true }),
      dbService.getLevels(),
      dbService.getDifficulties(),
    ]);

    return (
      <DialoguesClient
        initialDialogues={dbDialogues as Dialogue[]}
        initialLevels={dbLevels as Level[]}
        initialDifficulties={dbDifficulties as Difficulty[]}
      />
    );
  } catch {
    return <DialoguesClient initialDialogues={[]} initialLevels={[]} initialDifficulties={[]} />;
  }
}