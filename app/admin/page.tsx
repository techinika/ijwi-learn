'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/database';
import {
  BookOpen, Users, MessageCircle, Settings, Plus, Type, FileCode,
  Globe, BarChart3, ChevronRight, Layers, Languages, BookMarked, Play, Award
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [stats, setStats] = useState({ vocabulary: 0, stories: 0, levels: 0, learners: 0, categories: 0, difficulties: 0, languages: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [vocab, stories, levels, learners, categories, difficulties, languages] = await Promise.all([
        dbService.getVocabulary(),
        dbService.getStories(),
        dbService.getLevels(),
        dbService.getUsers(),
        dbService.getCategories(),
        dbService.getDifficulties(),
        dbService.getLanguages(),
      ]);
      setStats({
        vocabulary: vocab.length,
        stories: stories.length,
        levels: levels.length,
        learners: learners.length,
        categories: categories.length,
        difficulties: difficulties.length,
        languages: languages.length,
      });
    } catch (e) {
      console.log('Failed to load stats');
    }
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

  const sections = [
    { title: 'Content', items: [
      { href: '/admin/vocabulary', label: 'Vocabulary', icon: BookOpen, desc: 'Manage vocabulary words', color: 'bg-emerald-500' },
      { href: '/admin/stories', label: 'Stories', icon: BookMarked, desc: 'WYSIWYG story editor with translations', color: 'bg-primary-600' },
      { href: '/admin/levels', label: 'Levels', icon: Layers, desc: 'Manage learning levels & pricing', color: 'bg-purple-500' },
      { href: '/admin/videos', label: 'Videos', icon: Play, desc: 'Manage video lessons', color: 'bg-red-500' },
      { href: '/admin/tests', label: 'Tests', icon: FileCode, desc: 'Manage tests & questions', color: 'bg-amber-500' },
    ]},
    { title: 'Achievements', items: [
      { href: '/admin/certificates', label: 'Certificates', icon: Award, desc: 'Manage certificates', color: 'bg-yellow-500' },
    ]},
    { title: 'Configuration', items: [
      { href: '/admin/categories', label: 'Categories', icon: Type, desc: 'Manage vocabulary categories', color: 'bg-amber-500' },
      { href: '/admin/difficulties', label: 'Difficulties', icon: BarChart3, desc: 'Manage difficulty levels', color: 'bg-red-500' },
      { href: '/admin/languages', label: 'Languages', icon: Globe, desc: 'Manage translation languages', color: 'bg-indigo-500' },
    ]},
    { title: 'Community', items: [
      { href: '/admin/learners', label: 'Learners', icon: Users, desc: 'View and manage learners', color: 'bg-emerald-500' },
      { href: '/admin/chat', label: 'Chat', icon: MessageCircle, desc: 'Monitor teacher chat', color: 'bg-cyan-500' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-8">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-primary-100 mt-1">Manage your Kinyarwanda learning platform</p>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-10">
            {[
              { label: 'Vocabulary', value: stats.vocabulary, color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Stories', value: stats.stories, color: 'bg-primary-100 text-primary-600' },
              { label: 'Levels', value: stats.levels, color: 'bg-purple-100 text-purple-600' },
              { label: 'Learners', value: stats.learners, color: 'bg-blue-100 text-blue-600' },
              { label: 'Categories', value: stats.categories, color: 'bg-amber-100 text-amber-600' },
              { label: 'Difficulties', value: stats.difficulties, color: 'bg-red-100 text-red-600' },
              { label: 'Languages', value: stats.languages, color: 'bg-indigo-100 text-indigo-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <div className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {sections.map((section) => (
            <div key={section.title} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all flex items-center gap-4 group"
                    >
                      <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-500">{item.desc}</div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
