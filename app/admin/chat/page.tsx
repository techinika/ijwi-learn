'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService, UserProfile } from '@/lib/database';
import { ArrowLeft, MessageCircle, Users, Send } from 'lucide-react';

interface ChatMessage {
  role: 'learner' | 'teacher';
  text: string;
  time: string;
}

export default function AdminChatPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const learners = useMemo(
    () => users.filter(u => !u.isAdmin && !u.isTeacher),
    [users]
  );

  useEffect(() => {
    dbService.getUsers()
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load users', e);
        setLoading(false);
      });
  }, []);

  const openChat = (user: UserProfile) => {
    setSelectedUser(user);
    setMessages([
      { role: 'learner', text: 'Murakoze! Nifuza kwiga Kinyarwanda.', time: '10:30 AM' },
      { role: 'teacher', text: "Urabasha! Reba amasomo y'ibanza.", time: '10:31 AM' },
      { role: 'learner', text: 'Amasomo meza cyane! Narize amagambo menshi.', time: '10:35 AM' },
    ]);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      role: 'teacher',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewMessage('');
  };

  const getLastActivity = (user: UserProfile) => {
    const hash = user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const days = hash % 5;
    if (days === 0) return { label: 'Active now', color: 'bg-green-500' };
    if (days === 1) return { label: 'Today', color: 'bg-yellow-500' };
    return { label: `${days} days ago`, color: 'bg-gray-400' };
  };

  if (!isAdmin) {
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
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors">
              <ArrowLeft size={20} />
              <span>Back to Admin</span>
            </Link>
          </div>

          {selectedUser ? (
            <>
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white mb-8 flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="text-white/80 hover:text-white transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">Chat with {selectedUser.displayName}</h1>
                  <p className="text-cyan-100 mt-1">{selectedUser.email}</p>
                </div>
                <MessageCircle size={28} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md rounded-2xl p-4 ${msg.role === 'teacher' ? 'bg-primary-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-2 ${msg.role === 'teacher' ? 'text-primary-200' : 'text-gray-400'}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
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
                  <p className="text-cyan-100 mt-1">Monitor teacher-learner conversations ({learners.length})</p>
                </div>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">Loading...</div>
                ) : learners.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400">No learners found.</div>
                ) : learners.map(learner => {
                  const activity = getLastActivity(learner);
                  return (
                    <div key={learner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="relative">
                        {learner.photoURL ? (
                          <img src={learner.photoURL} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 text-lg font-bold">
                            {learner.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${activity.color} rounded-full border-2 border-white`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{learner.displayName}</div>
                        <div className="text-sm text-gray-500 truncate">{learner.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block w-2 h-2 ${activity.color} rounded-full`} />
                          <span className="text-xs text-gray-400">{activity.label}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openChat(learner)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        <MessageCircle size={16} />
                        Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
