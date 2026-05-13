import { dbService, Vocabulary, Story, TestQuestion } from './database';

let cachedVocabulary: Vocabulary[] = [];
let cachedStories: Story[] = [];
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    try {
      cachedVocabulary = await dbService.getVocabulary();
      cachedStories = await dbService.getStories();
      isInitialized = true;
    } catch (error) {
      console.log('Using offline data - Database not connected');
      isInitialized = true;
    }
  }
}

export async function getRandomVocabulary(
  count: number, 
  options?: { levelId?: string; difficulty?: string; category?: string }
): Promise<Vocabulary[]> {
  await ensureInitialized();
  
  let filtered = [...cachedVocabulary];
  
  if (options?.levelId) {
    filtered = filtered.filter(v => v.levelId === options.levelId);
  }
  if (options?.difficulty) {
    filtered = filtered.filter(v => v.difficulty === options.difficulty);
  }
  if (options?.category) {
    filtered = filtered.filter(v => v.category === options.category);
  }
  
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function getRandomStories(
  count: number, 
  options?: { levelId?: string; difficulty?: string }
): Promise<Story[]> {
  await ensureInitialized();
  
  let filtered = [...cachedStories];
  
  if (options?.levelId) {
    filtered = filtered.filter(s => s.levelId === options.levelId);
  }
  if (options?.difficulty) {
    filtered = filtered.filter(s => s.difficulty === options.difficulty);
  }
  
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function generateTestQuestions(
  count: number, 
  levelId?: string, 
  difficulty?: string
): Promise<TestQuestion[]> {
  try {
    const questions = await dbService.generateTestQuestions(levelId || '1', count);
    if (questions.length > 0) return questions;
  } catch (error) {
    console.log('Using fallback test questions');
  }
  
  const vocab = await getRandomVocabulary(count * 2, { levelId, difficulty });
  
  if (vocab.length < 4) {
    return [{
      question: 'What is "Muraho" in English?',
      options: ['Hello', 'Goodbye', 'Thank you', 'Please'],
      correctAnswer: 0,
    }];
  }
  
  const shuffled = vocab.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  return selected.map((item, idx) => {
    const others = vocab.filter(v => v.id !== item.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [item, ...others].sort(() => Math.random() - 0.5);
    
    return {
      question: `What is "${item.wordKinyarwanda}" in English?`,
      options: options.map(o => o.word),
      correctAnswer: options.findIndex(o => o.id === item.id),
    };
  });
}

export async function getVocabularyByLevel(levelId: string) {
  await ensureInitialized();
  return cachedVocabulary.filter(v => v.levelId === levelId);
}

export async function getStoriesByLevel(levelId: string) {
  await ensureInitialized();
  return cachedStories.filter(s => s.levelId === levelId);
}

export async function refreshContent() {
  isInitialized = false;
  cachedVocabulary = [];
  cachedStories = [];
  await ensureInitialized();
}