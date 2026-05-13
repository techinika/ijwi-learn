'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { dbService, Video } from '@/lib/database';
import { ArrowLeft, Play, GraduationCap, MessageCircle, BookOpen, BookMarked, ChevronLeft, X, Clock, BookOpenCheck } from 'lucide-react';

interface VideoWithLevel extends Video {
  levelTitle: string;
}

const levelConfig = [
  { id: '1', title: 'Beginner', icon: GraduationCap, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  { id: '2', title: 'Practice', icon: MessageCircle, color: 'bg-primary-500', textColor: 'text-primary-700', bgColor: 'bg-primary-100' },
  { id: '3', title: 'Intermediate', icon: BookOpen, color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-100' },
  { id: '4', title: 'Fluent', icon: BookMarked, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
];

const defaultVideos: VideoWithLevel[] = [
  { id: '1', levelId: '1', title: 'Basic Greetings', description: 'Learn essential greetings in Kinyarwanda', videoUrl: '', duration: 630, category: 'basics', isActive: true, levelTitle: 'Beginner' },
  { id: '2', levelId: '1', title: 'Numbers 1-100', description: 'Master counting in Kinyarwanda', videoUrl: '', duration: 945, category: 'basics', isActive: true, levelTitle: 'Beginner' },
  { id: '3', levelId: '1', title: 'Common Phrases', description: 'Essential phrases for daily conversation', videoUrl: '', duration: 740, category: 'phrases', isActive: true, levelTitle: 'Beginner' },
  { id: '4', levelId: '2', title: 'Conversation Practice', description: 'Practice real-world conversations', videoUrl: '', duration: 1200, category: 'conversation', isActive: true, levelTitle: 'Practice' },
  { id: '5', levelId: '3', title: 'Verb Conjugation Basics', description: 'Learn verb conjugation rules', videoUrl: '', duration: 1530, category: 'grammar', isActive: true, levelTitle: 'Intermediate' },
  { id: '6', levelId: '3', title: 'Noun Classes Explained', description: 'Understanding noun classes in Kinyarwanda', videoUrl: '', duration: 1095, category: 'grammar', isActive: true, levelTitle: 'Intermediate' },
  { id: '7', levelId: '4', title: 'Reading Stories', description: 'Advanced reading comprehension', videoUrl: '', duration: 1320, category: 'stories', isActive: true, levelTitle: 'Fluent' },
  { id: '8', levelId: '4', title: 'Cultural Insights', description: 'Learn about Rwandan culture', videoUrl: '', duration: 1800, category: 'culture', isActive: true, levelTitle: 'Fluent' },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getLevelInfo(levelId: string) {
  return levelConfig.find(l => l.id === levelId) || levelConfig[0];
}

export default function VideosPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [playingVideo, setPlayingVideo] = useState<VideoWithLevel | null>(null);
  const [videos, setVideos] = useState<VideoWithLevel[]>(defaultVideos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const dbVideos = await dbService.getVideos();
      if (dbVideos.length > 0) {
        const videosWithLevels = await Promise.all(
          dbVideos.map(async (video) => {
            const level = await dbService.getLevel(video.levelId);
            return { ...video, levelTitle: level?.title || 'Unknown' };
          })
        );
        setVideos(videosWithLevels);
      }
    } catch (error) {
      console.log('Using default videos');
    }
    setLoading(false);
  };

  const levels = ['All', 'Beginner', 'Practice', 'Intermediate', 'Fluent'];
  const filteredVideos = selectedLevel === 'All' 
    ? videos 
    : videos.filter(v => v.levelTitle === selectedLevel);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Video Lessons</h1>
            <p className="text-primary-100">Learn Kinyarwanda through engaging video content</p>
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
                  selectedLevel === level
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading videos...</p>
            </div>
          ) : playingVideo ? (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setPlayingVideo(null)} className="text-primary-600 hover:underline flex items-center gap-2 text-sm font-medium">
                  <ChevronLeft size={18} />
                  Back to Videos
                </button>
                <button onClick={() => setPlayingVideo(null)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-900/30"></div>
                <div className="relative text-center text-white">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Play size={48} className="ml-1" />
                  </div>
                  <div className="text-2xl font-bold">{playingVideo.title}</div>
                  <div className="text-gray-300 flex items-center justify-center gap-2 mt-2">
                    <Clock size={16} />
                    {formatDuration(playingVideo.duration)}
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{playingVideo.title}</h2>
              <p className="text-gray-600 mb-4">{playingVideo.description}</p>
              <div className="flex items-center gap-3">
                {(() => {
                  const levelInfo = getLevelInfo(playingVideo.levelId);
                  const LevelIcon = levelInfo.icon;
                  return (
                    <>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                        <LevelIcon size={14} className="inline mr-1" />
                        {playingVideo.levelTitle}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {formatDuration(playingVideo.duration)}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredVideos.map((video) => {
                const levelInfo = getLevelInfo(video.levelId);
                const LevelIcon = levelInfo.icon;
                return (
                  <button
                    key={video.id}
                    onClick={() => setPlayingVideo(video)}
                    className="bg-white rounded-xl p-5 text-left hover:shadow-lg border-2 border-gray-100 hover:border-primary-200 transition-all group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform">
                      <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Play size={28} className="ml-1" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{video.title}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${levelInfo.bgColor} ${levelInfo.textColor}`}>
                        <LevelIcon size={12} className="inline mr-1" />
                        {video.levelTitle}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {formatDuration(video.duration)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <BookOpenCheck size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h3>
              <p className="text-gray-500">No videos available for this level yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}