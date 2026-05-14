'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, ChatMessage, ChatThread } from '@/lib/database';
import { Loading, FetchLoading, ListSkeleton } from '@/app/AppLoading';
import { ArrowLeft, MessageCircle, Users, Send } from 'lucide-react';

export default function AdminChatPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  const loadThreads = async () => {
    try {
      const data = await dbService.getAllChatThreads();
      setThreads(data);
    } catch (e) {
      console.error('Failed to load threads', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    setFetchingMessages(true);
    try {
      const msgs = await dbService.getChatMessages(userId);
      setMessages(msgs);
      await dbService.markMessagesAsRead(userId);
      loadThreads();
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setFetchingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    await dbService.sendChatMessage({
      userId: selectedUserId,
      userName: selectedUserName,
      userEmail: '',
      content,
      role: 'teacher',
      timestamp: new Date(),
      read: false,
    });

    setMessages(prev => [...prev, {
      userId: selectedUserId,
      userName: selectedUserName,
      userEmail: '',
      content,
      role: 'teacher',
      timestamp: new Date(),
      read: true,
    }]);
    setSending(false);
  };

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

  const formatTime = (ts: Date | { toDate(): Date }) => {
    const date = 'toDate' in ts ? ts.toDate() : ts;
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors">
              <ArrowLeft size={20} />
              <span>Back to Admin</span>
            </Link>
          </div>

          {selectedUserId ? (
            <>
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white mb-8 flex items-center gap-3">
                <button onClick={() => setSelectedUserId(null)} className="text-white/80 hover:text-white transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">Chat with {selectedUserName}</h1>
                  <p className="text-cyan-100 mt-1">Reply to learner&apos;s messages</p>
                </div>
                <MessageCircle size={28} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400">No messages yet.</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md rounded-2xl p-4 ${
                          msg.role === 'teacher'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-2 ${msg.role === 'teacher' ? 'text-primary-200' : 'text-gray-400'}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-200 p-4 flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white mb-8 flex items-center gap-3">
                <Users size={28} />
                <div>
                  <h1 className="text-2xl font-bold">Chat Monitor</h1>
                  <p className="text-cyan-100 mt-1">Monitor and reply to learner messages ({threads.length})</p>
                </div>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <ListSkeleton />
                ) : threads.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">
                    No messages yet. Learners will appear here when they send messages.
                  </div>
                ) : (
                  threads.map(thread => (
                    <div key={thread.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                        setSelectedUserId(thread.learnerId);
                        setSelectedUserName(thread.learnerName);
                      }}>
                        <div className="font-semibold text-gray-900">{thread.learnerName}</div>
                        <div className="text-sm text-gray-500 truncate">{thread.learnerEmail}</div>
                        {thread.lastMessage && (
                          <div className="text-sm text-gray-400 truncate mt-1">
                            {thread.lastMessage}
                          </div>
                        )}
                      </div>
                      {thread.unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          {thread.unreadCount} new
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUserId(thread.learnerId);
                          setSelectedUserName(thread.learnerName);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        <MessageCircle size={16} />
                        Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}