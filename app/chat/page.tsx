'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'teacher';
  content: string;
}

const teacherResponses = [
  'Muraho! Ndashaka kubafasha iki?',
  'Birahaguye! Ningarutse.',
  'Murakoze kubaza. Ibyo ukeneye ni ibihe?',
  'Wakwiyongeramo utubitubo.',
  'Uburyo bwo kwiga bisheshe ni...',
  'Ibyo ubaza ni byiza. Continue.',
  'Ndumva ko ushaka kwiyubaka. Ni byiza!',
  'Kwiyunga neza. Ndashaka kugira ngo wumve.',
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'teacher', content: 'Muraho! Ndashaka kubafasha iki?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const randomResponse = teacherResponses[Math.floor(Math.random() * teacherResponses.length)];
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'teacher', content: randomResponse }]);
      setIsTyping(false);
    }, 2000);
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
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
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
                <div className="text-sm text-emerald-200">Typically replies within 5 minutes</div>
              </div>
            </div>

            <div className="h-[450px] flex flex-col">
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-base">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-2xl">
                      <div className="flex gap-1">
                        {[0, 0.1, 0.2].map((delay, i) => (
                          <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }}></span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
              <li>• Ask about grammar rules you don't understand</li>
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