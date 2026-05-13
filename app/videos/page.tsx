'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { dbService, Video, Level, VideoCategory } from '@/lib/database';
import { ArrowLeft, Play, ChevronLeft, X, Clock, BookOpenCheck } from 'lucide-react';

interface VideoWithLevel extends Video {
  levelTitle: string;
  levelColor: string;
  levelTextColor: string;
  levelBgColor: string;
  categoryName: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

function getLevelInfo(levelId: string, levels: Level[]) {
  const level = levels.find(l => l.id === levelId);
  if (!level) return { icon: Play, color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-100' };
  
  const colorMap: Record<string, string> = {
    green: 'bg-emerald-500',
    blue: 'bg-primary-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };
  
  return {
    icon: Play,
    color: colorMap[level.color] || 'bg-gray-500',
    textColor: `text-${level.color}-700` || 'text-gray-700',
    bgColor: `bg-${level.color}-100` || 'bg-gray-100',
  };
}

export default function VideosPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [playingVideo, setPlayingVideo] = useState<VideoWithLevel | null>(null);
  const [videos, setVideos] = useState<VideoWithLevel[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const [dbVideos, dbLevels, dbCategories] = await Promise.all([
        dbService.getVideos(),
        dbService.getLevels(),
        dbService.getVideoCategories({ isActive: true }),
      ]);
      setLevels(dbLevels);
      setCategories(dbCategories);
      
      if (dbVideos.length > 0) {
        const videosWithLevels: VideoWithLevel[] = dbVideos.map((video) => {
          const level = dbLevels.find(l => l.id === video.levelId);
          const category = dbCategories.find(c => c.slug === video.category);
          const colorMap: Record<string, string> = {
            green: 'bg-emerald-500',
            blue: 'bg-primary-500',
            purple: 'bg-purple-500',
            amber: 'bg-amber-500',
          };
          return {
            ...video,
            levelTitle: level?.title || 'Unknown',
            levelColor: colorMap[level?.color || 'gray'] || 'bg-gray-500',
            levelTextColor: `text-${level?.color || 'gray'}-700`,
            levelBgColor: `bg-${level?.color || 'gray'}-100`,
            categoryName: category?.name || video.category || 'Uncategorized',
          };
        });
        setVideos(videosWithLevels);
      }
    } catch (error) {
      console.log('Error loading videos:', error);
    }
    setLoading(false);
  };

  const levelOptions = ['All', ...levels.map(l => l.title)];
  const categoryOptions = ['All', ...categories.map(c => c.name)];
  
  const filteredVideos = videos.filter(v => {
    const levelMatch = selectedLevel === 'All' || v.levelTitle === selectedLevel;
    const categoryMatch = selectedCategory === 'All' || v.categoryName === selectedCategory;
    return levelMatch && categoryMatch;
  });

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

          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 self-center">Level:</span>
              {levelOptions.map((level) => (
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
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 self-center">Category:</span>
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
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
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-6 overflow-hidden">
                {playingVideo.videoUrl ? (
                  <iframe
                    src={getYouTubeEmbedUrl(playingVideo.videoUrl) || ''}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
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
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{playingVideo.title}</h2>
              <p className="text-gray-600 mb-4">{playingVideo.description}</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${playingVideo.levelBgColor} ${playingVideo.levelTextColor}`}>
                  {playingVideo.levelTitle}
                </span>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(playingVideo.duration)}
                </span>
              </div>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setPlayingVideo(video)}
                  className="bg-white rounded-xl p-5 text-left hover:shadow-lg border-2 border-gray-100 hover:border-primary-200 transition-all group"
                >
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform relative overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg">
                        <Play size={28} className="ml-1" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
                        <Play size={24} className="text-primary-600 ml-1" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{video.title}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{video.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${video.levelBgColor} ${video.levelTextColor}`}>
                      {video.levelTitle}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(video.duration)}
                    </span>
                  </div>
                </button>
              ))}
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