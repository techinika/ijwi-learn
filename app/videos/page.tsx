import { dbService, Video, Level, VideoCategory } from '@/lib/database';
import VideosClient from './VideosClient';

export const metadata = {
  title: 'Videos - IJWI-LEARN',
  description: 'Learn Kinyarwanda through video tutorials and lessons.',
};

export default async function VideosPage() {
  try {
    const [dbVideos, dbLevels, dbCategories] = await Promise.all([
      dbService.getVideos(),
      dbService.getLevels(),
      dbService.getVideoCategories({ isActive: true }),
    ]);

    return (
      <VideosClient
        initialVideos={dbVideos as Video[]}
        initialLevels={dbLevels as Level[]}
        initialCategories={dbCategories as VideoCategory[]}
      />
    );
  } catch {
    return <VideosClient initialVideos={[]} initialLevels={[]} initialCategories={[]} />;
  }
}