'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, Lock, Users, MessageCircle, BookOpen, GraduationCap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const scenarios = [
  { id: 'greeting', title: 'Meeting Someone' },
  { id: 'ordering', title: 'At a Restaurant' },
  { id: 'shopping', title: 'Shopping' },
  { id: 'directions', title: 'Asking Directions' },
];

const aiResponses: Record<string, string[]> = {
  greeting: ['Muraho! Ubyteye mute?', 'Mwaramutse! Bite?', 'Muraho! Uragaba mute?'],
  ordering: ['Muraho! Bishobora kunywa ikindi?', 'Mwashaka iki?', 'Nimero ya menu uri hano.'],
  shopping: ['Iki giciye hehe?', 'Ni aka kapi?', 'Ndashaka kugura ibi.'],
  directions: ['Ishuri riri hafi yano.', 'Fata ibumoso utageze.', 'Inzu yawe iri hehe?'],
};

export default function PracticePage() {
  const { userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeScenario, setActiveScenario] = useState(scenarios[0]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAccess = userData?.purchasedLevels?.includes(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startConversation = () => {
    setMessages([]);
    const firstResponse = aiResponses[activeScenario.id][0];
    setIsTyping(true);
    setTimeout(() => {
      setMessages([{ id: '1', role: 'assistant', content: firstResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const responses = aiResponses[activeScenario.id];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: randomResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Level Locked</h1>
            <p className="text-gray-600 mb-6">Upgrade to access AI-powered conversation practice.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              <ArrowLeft size={18} />
              Back to Levels
            </Link>
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
            <Link href="/" className="text-primary-600 hover:underline">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Practice with AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2 flex-wrap">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => { setActiveScenario(scenario); setMessages([]); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      activeScenario.id === scenario.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {scenario.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[450px] flex flex-col">
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <MessageCircle size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-base">Click "Start" to begin practicing</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-base">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
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
                {messages.length === 0 ? (
                  <button onClick={startConversation} className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                    Start Conversation
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type in Kinyarwanda..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg"
                    />
                    <button onClick={sendMessage} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      <Send size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-primary-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tips</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Try responding in Kinyarwanda</li>
              <li>• Use vocabulary from previous lessons</li>
              <li>• Don't worry about mistakes</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}