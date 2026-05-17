"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { dbService, Video, Level, VideoCategory } from "@/lib/database";
import { Loading } from "@/app/AppLoading";
import {
  ArrowLeft,
  Play,
  Clock,
  BookOpenCheck,
  ChevronLeft as PrevPage,
  ChevronRight as NextPage,
} from "lucide-react";

interface VideoWithLevel extends Video {
  levelTitle: string;
  levelColor: string;
  levelTextColor: string;
  levelBgColor: string;
  categoryName: string;
}

const VIDEOS_PER_PAGE = 6;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

export default function VideosClient() {
  const { userData } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [videos, setVideos] = useState<VideoWithLevel[]>([]);
  const [allVideos, setAllVideos] = useState<VideoWithLevel[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const purchasedLevelIds = userData?.purchasedLevels || [];

  useEffect(() => {
    loadData();
  }, [userData]);

  const loadData = async () => {
    try {
      const [dbVideos, dbLevels, dbCategories] = await Promise.all([
        dbService.getVideos(),
        dbService.getLevels(),
        dbService.getVideoCategories({ isActive: true }),
      ]);
      setLevels(dbLevels);
      setCategories(dbCategories);

      const colorMap: Record<string, string> = {
        green: "bg-emerald-500",
        blue: "bg-primary-500",
        purple: "bg-purple-500",
        amber: "bg-amber-500",
      };

      const videosWithLevels: VideoWithLevel[] = dbVideos.map((video) => {
        const level = dbLevels.find((l) => l.id === video.levelId);
        const category = dbCategories.find((c) => c.slug === video.category);
        return {
          ...video,
          levelTitle: level?.title || "Unknown",
          levelColor: colorMap[level?.color || "gray"] || "bg-gray-500",
          levelTextColor: `text-${level?.color || "gray"}-700`,
          levelBgColor: `bg-${level?.color || "gray"}-100`,
          categoryName: category?.name || video.category || "Uncategorized",
        };
      });
      setAllVideos(videosWithLevels);
      setVideos(videosWithLevels);
    } catch (error) {
      console.log("Error loading videos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedCategory]);

  const levelOptions = [
    "All",
    ...levels
      .filter((l) => {
        const idx = levels.indexOf(l) + 1;
        return purchasedLevelIds.includes(idx);
      })
      .map((l) => l.title),
  ];

  const filteredCategories = selectedLevel === "All"
    ? categories
    : categories.filter(c => {
        const level = levels.find(l => l.title === selectedLevel);
        return level ? (c.levelIds || []).includes(level.id) : true;
      });
  const categoryOptions = ["All", ...filteredCategories.map((c) => c.name)];

  useEffect(() => {
    if (selectedLevel !== "All") {
      const level = levels.find(l => l.title === selectedLevel);
      const validCategories = level
        ? categories.filter(c => (c.levelIds || []).includes(level.id))
        : categories;
      if (selectedCategory !== "All" && !validCategories.some(c => c.name === selectedCategory)) {
        setSelectedCategory("All");
      }
    }

    const purchasedTitleSet = new Set(
      levels
        .filter((_, idx) => purchasedLevelIds.includes(idx + 1))
        .map((l) => l.title)
    );

    const filtered = allVideos.filter((v) => {
      const levelMatch =
        selectedLevel === "All" || v.levelTitle === selectedLevel;
      const categoryMatch =
        selectedCategory === "All" || v.categoryName === selectedCategory;
      const hasAccess = selectedLevel === "All" || purchasedTitleSet.has(v.levelTitle);

      return levelMatch && categoryMatch && hasAccess;
    });

    setVideos(filtered);
  }, [selectedLevel, selectedCategory, allVideos, levels, categories, purchasedLevelIds]);

  const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = videos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Loading text="Loading videos..." />
          </div>
        </main>
      </div>
    );
  }

  if (paginatedVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-20 md:pt-28 pb-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
                <ArrowLeft size={18} />
                Back
              </Link>
            </div>
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <Play size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Available</h3>
              <p className="text-gray-500 mb-6">
                {purchasedLevelIds.length === 0
                  ? "Purchase a level to access videos."
                  : "No videos match your current filters."}
              </p>
              {purchasedLevelIds.length === 0 && (
                <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                  View Levels
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 md:pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-rose-600 to-rose-700 rounded-2xl p-6 text-white mb-6">
            <h1 className="text-2xl font-bold mb-2">Video Lessons</h1>
            <p className="text-rose-100">Learn Kinyarwanda through video tutorials.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-primary-500"
            >
              {levelOptions.map((level) => (
                <option key={level} value={level}>
                  {level === "All" ? "All Levels" : level}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-primary-500"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedVideos.map((video) => {
              const embedUrl = getYouTubeEmbedUrl(video.videoUrl);
              return (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:shadow-lg hover:border-rose-300 transition-all overflow-hidden block"
                >
                  <div className="relative aspect-video bg-gray-900">
                    {embedUrl ? (
                      <iframe
                        src={`${embedUrl}?rel=0`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Play size={32} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDuration(video.duration)}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${video.levelBgColor} ${video.levelTextColor}`}>
                        {video.levelTitle}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              >
                <PrevPage size={20} />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              >
                <NextPage size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}