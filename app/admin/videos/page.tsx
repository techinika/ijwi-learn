'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Video, Level, VideoCategory } from '@/lib/database';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Play, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface VideoFormData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  levelId: string;
  duration: number;
  category: string;
  isActive: boolean;
}

const defaultFormData: VideoFormData = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  levelId: '',
  duration: 0,
  category: '',
  isActive: true,
};

export default function AdminVideosPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosData, levelsData, categoriesData] = await Promise.all([
        dbService.getVideos(),
        dbService.getLevels(),
        dbService.getVideoCategories({ isActive: true }),
      ]);
      setVideos(videosData);
      setLevels(levelsData);
      setCategories(categoriesData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.levelId) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingVideo) {
        await dbService.updateVideo(editingVideo.id, formData);
      } else {
        await dbService.createVideo(formData as Omit<Video, 'id'>);
      }
      await loadData();
      resetForm();
    } catch (e) {
      console.error('Error saving video:', e);
      alert('Failed to save video');
    }
    setSaving(false);
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      levelId: video.levelId,
      duration: video.duration,
      category: video.category,
      isActive: video.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await dbService.deleteVideo(videoId);
      await loadData();
    } catch (e) {
      console.error('Error deleting video:', e);
    }
  };

  const handleToggleActive = async (video: Video) => {
    try {
      await dbService.updateVideo(video.id, { isActive: !video.isActive });
      await loadData();
    } catch (e) {
      console.error('Error toggling video status:', e);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingVideo(null);
    setShowForm(false);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLevelTitle = (levelId: string) => levels.find(l => l.id === levelId)?.title || 'Unknown';

  if (!isAdmin && !isTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a href="/admin" className="text-primary-600 hover:underline flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Admin
            </a>
          </div>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Videos Management</h1>
            <p className="text-primary-100">Manage video lessons for each level</p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : showForm ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingVideo ? 'Edit Video' : 'Add New Video'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter video title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter video description"
                    rows={3}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={formData.levelId}
                      onChange={e => setFormData(prev => ({ ...prev, levelId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a level</option>
                      {levels.map(level => (
                        <option key={level.id} value={level.id}>{level.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <span className="text-gray-700">Active</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video URL</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={e => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=xxxxx or https://youtu.be/xxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste a YouTube video URL. The video will be embedded automatically.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL (optional)</label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={e => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Video'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="flex justify-end gap-3 mb-6">
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${
                    showInactive ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <EyeOff size={18} />
                  {showInactive ? 'Hide Inactive' : 'Show All'}
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"
                >
                  <Plus size={18} />
                  Add New Video
                </button>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <Play size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Yet</h3>
                  <p className="text-gray-500 mb-4">Add video lessons for learners.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                  >
                    <Plus size={18} />
                    Add First Video
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {videos.filter(v => showInactive || v.isActive).map(video => (
                    <div key={video.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${video.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                      <div
                        className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative cursor-pointer"
                        onClick={() => setPreviewVideo(video)}
                      >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <Play size={32} className="text-white ml-1" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <ExternalLink size={12} />
                          Preview
                        </div>
                        {!video.isActive && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Inactive
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{video.title}</h3>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{video.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                              {getLevelTitle(video.levelId)}
                            </span>
                            <span className="text-gray-500 text-xs">{formatDuration(video.duration)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleActive(video)}
                              className={`p-1.5 rounded-lg ${video.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                              title={video.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {video.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button
                              onClick={() => handleEdit(video)}
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(video.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {previewVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{previewVideo.title}</h3>
              <button onClick={() => setPreviewVideo(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video">
              {previewVideo.videoUrl ? (
                <iframe
                  src={previewVideo.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                  <p>No video URL set</p>
                </div>
              )}
            </div>
            {previewVideo.description && (
              <div className="p-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">{previewVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}