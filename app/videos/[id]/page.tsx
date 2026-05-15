'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, Video, Level, VideoComment } from '@/lib/database';
import { ArrowLeft, Clock, Send, User, MessageCircle, ChevronRight } from 'lucide-react';

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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, userData } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
    loadComments();
  }, [id]);

  const loadVideo = async () => {
    try {
      const v = await dbService.getVideo(id);
      if (!v) return;
      setVideo(v);
      const levels = await dbService.getLevels();
      const vidLevel = levels.find(l => l.id === v.levelId);
      if (vidLevel) setLevel(vidLevel);
    } catch (e) {
      console.error('Failed to load video', e);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    try {
      const c = await dbService.getVideoComments(id);
      setComments(c);
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setSending(true);
    try {
      await dbService.addVideoComment({
        videoId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        content: newComment.trim(),
        parentId: null,
        createdAt: new Date(),
      });
      setNewComment('');
      await loadComments();
    } catch (e) {
      console.error('Failed to post comment', e);
    }
    setSending(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    setSending(true);
    try {
      await dbService.addVideoComment({
        videoId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        content: replyContent.trim(),
        parentId,
        createdAt: new Date(),
      });
      setReplyContent('');
      setReplyTo(null);
      await loadComments();
    } catch (e) {
      console.error('Failed to post reply', e);
    }
    setSending(false);
  };

  const topComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const embedUrl = video?.videoUrl ? getYouTubeEmbedUrl(video.videoUrl) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-28 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-12 px-4">
          <div className="max-w-3xl mx-auto text-center py-16">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Video Not Found</h1>
            <Link href="/videos" className="text-primary-600 hover:underline">Back to Videos</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="pt-16 sm:pt-20">
        <div className="bg-black w-full flex items-center justify-center pt-4 sm:pt-6">
          {embedUrl ? (
            <div className="w-full max-w-5xl mb-4 sm:mb-6" style={{ maxHeight: '70vh' }}>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center py-24 text-white max-w-5xl">
              <p>Video unavailable</p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          <Link href="/videos" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition">
            <ChevronRight size={14} className="rotate-180" />
            Back to Videos
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
          <div className="flex items-center gap-3 mb-4">
            {level && (
              <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-medium">
                {level.title}
              </span>
            )}
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <Clock size={14} />
              {formatDuration(video.duration)}
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{video.description}</p>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageCircle size={20} />
              Comments ({comments.length})
            </h2>

            {user ? (
              <div className="flex gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this video..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                    rows={3}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmitComment(); }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSubmitComment}
                      disabled={sending || !newComment.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {sending ? 'Posting...' : 'Post Comment'}
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-4 text-center mb-6">
                <p className="text-gray-400 text-sm">Sign in to leave a comment</p>
              </div>
            )}

            {topComments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                        {comment.userPhotoURL ? (
                          <img src={comment.userPhotoURL} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          comment.userName.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">{comment.userName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="text-xs text-gray-500 hover:text-primary-400 mt-1 transition"
                        >
                          {replyTo === comment.id ? 'Cancel' : 'Reply'}
                        </button>

                        {replyTo === comment.id && (
                          <div className="mt-3 flex gap-2">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                              rows={2}
                            />
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={sending || !replyContent.trim()}
                              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-xs"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        )}

                        {getReplies(comment.id).length > 0 && (
                          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-700">
                            {getReplies(comment.id).map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                                  {reply.userPhotoURL ? (
                                    <img src={reply.userPhotoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    reply.userName.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white text-xs">{reply.userName}</span>
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(reply.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-xs mt-0.5">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
