export interface Vocabulary {
  id: string;
  levelId: string;
  word: string;
  wordKinyarwanda: string;
  translations: Record<string, string>;
  pronunciation?: string;
  difficulty: string;
  category: string;
}

export interface StorySentence {
  kinyarwanda: string;
  translations: Record<string, string>;
}

export interface Story {
  id: string;
  levelId: string;
  title: string;
  titleTranslations: Record<string, string>;
  difficulty: string;
  category: string;
  sentences: StorySentence[];
  isActive: boolean;
}

export interface Level {
  id: string;
  title: string;
  description: string;
  price: number;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}

export interface Lesson {
  id: string;
  levelId: string;
  title: string;
  titleKinyarwanda: string;
  content: string;
  contentKinyarwanda: string;
  type: 'vocabulary' | 'grammar' | 'story' | 'phrase';
  order: number;
  isActive: boolean;
}

export interface Video {
  id: string;
  levelId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  order: number;
  isActive: boolean;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: string;
  levelId: string;
  title: string;
  difficulty: string;
  questions: TestQuestion[];
  passingScore: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameKinyarwanda: string;
  slug: string;
  levelIds: string[];
  isActive: boolean;
}

export interface Difficulty {
  id: string;
  name: string;
  nameKinyarwanda: string;
  slug: string;
  order: number;
  isActive: boolean;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
  flag: string;
}

export interface DialogueLine {
  speakerIndex: number;
  kinyarwanda: string;
  english: string;
}

export interface Dialogue {
  id: string;
  levelId: string;
  title: string;
  description: string;
  difficulty: string;
  speakers: string[];
  lines: DialogueLine[];
  isActive: boolean;
}
