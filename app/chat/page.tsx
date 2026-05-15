'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/database';
import { Loading, FetchLoading } from '@/app/AppLoading';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';

interface ChatMessageUI {
  id: string;
  role: 'learner' | 'teacher';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    try {
      const msgs = await dbService.getChatMessages(user.uid);
      setMessages(msgs.map(m => ({
        id: m.id || '',
        role: m.role,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(),
      })));
      if (msgs.length === 0) {
        setMessages([{
          id: 'system',
          role: 'teacher',
          content: 'Welcome! How can I help you learn Kinyarwanda today?',
          timestamp: new Date(),
        }]);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    await dbService.sendChatMessage({
      userId: user.uid,
      userName: user.displayName || 'Learner',
      userEmail: user.email || '',
      content,
      role: 'learner',
      timestamp: new Date(),
      read: false,
    });

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'learner',
      content,
      timestamp: new Date(),
    }]);
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={32} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to chat with a teacher.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 md:pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-blue-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Chat with Teacher</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <div className="font-semibold">Teacher Support</div>
                <div className="text-sm text-emerald-200">Your messages are sent to the admin</div>
              </div>
            </div>

            <div className="h-[calc(100vh-280px)] md:h-[450px] min-h-[300px] flex flex-col">
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {loading ? (
                  <Loading text="Loading conversation..." />
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'learner' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl ${
                        msg.role === 'learner'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-base">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                  <button onClick={sendMessage} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tips</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Ask about grammar rules you don&apos;t understand</li>
              <li>• Request help with pronunciation</li>
              <li>• Ask for vocabulary explanations</li>
              <li>• Get feedback on your progress</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}