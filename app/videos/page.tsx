"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { dbService, Video, Level, VideoCategory } from "@/lib/database";
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

export default function VideosPage() {
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
  const levelIdMap = new Map(levels.map((l, idx) => [idx + 1, l.id]));

  useEffect(() => {
    loadVideos();
  }, [userData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedCategory]);

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
    setCurrentPage(1);
  }, [selectedLevel, selectedCategory, allVideos, purchasedLevelIds, levels]);

  const filteredVideos = videos;
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/"
              className="text-primary-600 hover:underline font-medium flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Video Lessons</h1>
            <p className="text-primary-100">
              Learn Kinyarwanda through engaging video content
            </p>
          </div>

          <div className="space-y-3 my-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {levelOptions.length > 1 && (
                <div className="flex-1">
                  <div className="sm:hidden">
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white"
                    >
                      {levelOptions.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:flex gap-2 flex-wrap" key="level">
                    <span className="text-sm font-medium text-gray-700 self-center">Level:</span>
                    {levelOptions.map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                          selectedLevel === level
                            ? "bg-primary-600 text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {categoryOptions.length > 1 && (
                <div className="flex-1">
                  <div className="sm:hidden">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:flex gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700 self-center">Category:</span>
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                          selectedCategory === cat
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading videos...</p>
            </div>
          ) : paginatedVideos.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 gap-6">
                {paginatedVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/videos/${video.id}`}
                    className="block bg-white rounded-xl p-5 text-left hover:shadow-lg border-2 border-gray-100 hover:border-primary-200 transition-all group"
                  >
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform relative overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
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
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {video.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${video.levelBgColor} ${video.levelTextColor}`}
                      >
                        {video.levelTitle}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {formatDuration(video.duration)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PrevPage size={20} />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <NextPage size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <BookOpenCheck size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Videos Found
              </h3>
              <p className="text-gray-500">
                No videos available for this level yet.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}