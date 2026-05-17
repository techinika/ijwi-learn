import { dbService, Dialogue } from '@/lib/database';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ChevronLeft, MessageSquare, Users } from 'lucide-react';

const speakerColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const dialogue = await dbService.getDialogue(id);
    return {
      title: `${dialogue?.title || 'Dialogue'} - IJWI-LEARN`,
      description: dialogue?.description || 'Practice Kinyarwanda dialogue.',
    };
  } catch {
    return { title: 'Dialogue - IJWI-LEARN' };
  }
}

export default async function DialoguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dialogue = await dbService.getDialogue(id) as Dialogue | null;

  if (!dialogue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-20 md:pt-28 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Dialogue Not Found</h1>
            <Link href="/dialogues" className="text-primary-600 hover:underline">Back to Dialogues</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main className="pt-20 md:pt-30 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dialogues" className="text-primary-600 hover:underline font-medium flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Dialogues
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="h-2 bg-cyan-500"></div>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{dialogue.title}</h1>
              {dialogue.description && (
                <p className="text-gray-500 mb-4">{dialogue.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {dialogue.speakers.join(', ')}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={16} />
                  {dialogue.lines.length} lines
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {dialogue.lines.map((line, idx) => {
              const colorClass = speakerColors[line.speakerIndex % speakerColors.length];
              const speakerName = dialogue.speakers[line.speakerIndex] || `Speaker ${line.speakerIndex + 1}`;
              return (
                <div key={idx} className="bg-white rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                      {speakerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{speakerName}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-base text-gray-800 leading-snug">{line.kinyarwanda}</p>
                        <p className="text-sm text-gray-500 leading-snug">{line.english}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/dialogues"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
            >
              <ChevronLeft size={18} />
              More Dialogues
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}