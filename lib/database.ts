import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Unsubscribe
} from 'firebase/firestore';

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

export interface Test {
  id: string;
  levelId: string;
  title: string;
  questions: TestQuestion[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  passingScore: number;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Lesson {
  id: string;
  levelId: string;
  title: string;
  titleKinyarwanda: string;
  type: 'vocabulary' | 'grammar' | 'story' | 'phrase';
  order: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  currentLevel: number;
  purchasedLevels: number[];
  isAdmin: boolean;
  isTeacher: boolean;
  totalPoints: number;
  testsCompleted: number;
  consecutivePasses: number;
  vocabularyLearned: number;
  createdAt: Date;
}

export interface Certificate {
  id: string;
  userId: string;
  levelId: number;
  levelName: string;
  score: number;
  completedAt: Date;
  certificateId: string;
}

export interface Video {
  id: string;
  levelId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  isActive: boolean;
}

export interface PointHistory {
  id: string;
  userId: string;
  points: number;
  reason: string;
  type: 'test' | 'vocabulary' | 'practice' | 'streak' | 'certificate' | 'other';
  relatedId?: string;
  createdAt: Date;
}

export interface UserStats {
  totalPoints: number;
  testsCompleted: number;
  vocabularyLearned: number;
  consecutivePasses: number;
  certificatesEarned: number;
  videosWatched: number;
  practiceSessions: number;
  lastActivityAt: Date;
}

export interface Category {
  id: string;
  name: string;
  nameKinyarwanda: string;
  slug: string;
  levelId: string;
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

class DatabaseService {
  private levelsCollection = collection(db, 'levels');
  private vocabularyCollection = collection(db, 'vocabulary');
  private storiesCollection = collection(db, 'stories');
  private testsCollection = collection(db, 'tests');
  private lessonsCollection = collection(db, 'lessons');
  private usersCollection = collection(db, 'users');
  private certificatesCollection = collection(db, 'certificates');
  private videosCollection = collection(db, 'videos');
  private pointHistoryCollection = collection(db, 'pointHistory');
  private categoriesCollection = collection(db, 'categories');
  private difficultiesCollection = collection(db, 'difficulties');
  private languagesCollection = collection(db, 'languages');

  // LEVELS
  async getLevels(): Promise<Level[]> {
    const q = query(this.levelsCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Level));
  }

  async getLevel(id: string): Promise<Level | null> {
    const docRef = doc(this.levelsCollection, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Level : null;
  }

  async createLevel(data: Omit<Level, 'id'>): Promise<string> {
    const docRef = await addDoc(this.levelsCollection, data);
    return docRef.id;
  }

  async updateLevel(id: string, data: Partial<Level>): Promise<void> {
    await updateDoc(doc(this.levelsCollection, id), data);
  }

  async deleteLevel(id: string): Promise<void> {
    await deleteDoc(doc(this.levelsCollection, id));
  }

  // VOCABULARY
  async getVocabulary(filters?: { levelId?: string; difficulty?: string; category?: string }): Promise<Vocabulary[]> {
    let q = query(this.vocabularyCollection, orderBy('word'));
    if (filters?.levelId) {
      q = query(this.vocabularyCollection, where('levelId', '==', filters.levelId), orderBy('word'));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vocabulary));
    
    if (filters?.difficulty) {
      results = results.filter(r => r.difficulty === filters.difficulty);
    }
    if (filters?.category) {
      results = results.filter(r => r.category === filters.category);
    }
    return results;
  }

  async createVocabulary(data: Omit<Vocabulary, 'id'>): Promise<string> {
    const docRef = await addDoc(this.vocabularyCollection, data);
    return docRef.id;
  }

  async updateVocabulary(id: string, data: Partial<Vocabulary>): Promise<void> {
    await updateDoc(doc(this.vocabularyCollection, id), data);
  }

  async deleteVocabulary(id: string): Promise<void> {
    await deleteDoc(doc(this.vocabularyCollection, id));
  }

  // STORIES
  async getStories(filters?: { levelId?: string; difficulty?: string }): Promise<Story[]> {
    let q = query(this.storiesCollection, orderBy('title'));
    if (filters?.levelId) {
      q = query(this.storiesCollection, where('levelId', '==', filters.levelId), orderBy('title'));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story));
    
    if (filters?.difficulty) {
      results = results.filter(r => r.difficulty === filters.difficulty);
    }
    return results;
  }

  async createStory(data: Omit<Story, 'id'>): Promise<string> {
    const docRef = await addDoc(this.storiesCollection, data);
    return docRef.id;
  }

  async updateStory(id: string, data: Partial<Story>): Promise<void> {
    await updateDoc(doc(this.storiesCollection, id), data);
  }

  async deleteStory(id: string): Promise<void> {
    await deleteDoc(doc(this.storiesCollection, id));
  }

  // TESTS
  async getTests(filters?: { levelId?: string; difficulty?: string }): Promise<Test[]> {
    let q = query(this.testsCollection);
    if (filters?.levelId) {
      q = query(this.testsCollection, where('levelId', '==', filters.levelId));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Test));
    
    if (filters?.difficulty) {
      results = results.filter(r => r.difficulty === filters.difficulty);
    }
    return results;
  }

  async getTest(id: string): Promise<Test | null> {
    const docRef = doc(this.testsCollection, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Test : null;
  }

  async createTest(data: Omit<Test, 'id'>): Promise<string> {
    const docRef = await addDoc(this.testsCollection, data);
    return docRef.id;
  }

  async updateTest(id: string, data: Partial<Test>): Promise<void> {
    await updateDoc(doc(this.testsCollection, id), data);
  }

  async deleteTest(id: string): Promise<void> {
    await deleteDoc(doc(this.testsCollection, id));
  }

  // LESSONS
  async getLessons(filters?: { levelId?: string }): Promise<Lesson[]> {
    let q = query(this.lessonsCollection, orderBy('order'));
    if (filters?.levelId) {
      q = query(this.lessonsCollection, where('levelId', '==', filters.levelId), orderBy('order'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
  }

  async createLesson(data: Omit<Lesson, 'id'>): Promise<string> {
    const docRef = await addDoc(this.lessonsCollection, data);
    return docRef.id;
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
    await updateDoc(doc(this.lessonsCollection, id), data);
  }

  async deleteLesson(id: string): Promise<void> {
    await deleteDoc(doc(this.lessonsCollection, id));
  }

  // USERS
  async getUsers(): Promise<UserProfile[]> {
    const q = query(this.usersCollection, orderBy('totalPoints', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  }

  async getUser(id: string): Promise<UserProfile | null> {
    const docRef = doc(this.usersCollection, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as UserProfile : null;
  }

  async updateUser(id: string, data: Partial<UserProfile>): Promise<void> {
    await updateDoc(doc(this.usersCollection, id), data);
  }

  subscribeToUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
    const q = query(this.usersCollection, orderBy('totalPoints', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      callback(users);
    });
  }

  // CERTIFICATES
  async getCertificates(userId?: string): Promise<Certificate[]> {
    let q = query(this.certificatesCollection, orderBy('completedAt', 'desc'));
    if (userId) {
      q = query(this.certificatesCollection, where('userId', '==', userId), orderBy('completedAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
  }

  async getAllCertificates(): Promise<Certificate[]> {
    const q = query(this.certificatesCollection, orderBy('completedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
  }

  async createCertificate(data: Omit<Certificate, 'id'>): Promise<string> {
    const docRef = await addDoc(this.certificatesCollection, data);
    return docRef.id;
  }

  async deleteCertificate(id: string): Promise<void> {
    await deleteDoc(doc(this.certificatesCollection, id));
  }

  // Generate random questions from vocabulary
  async generateTestQuestions(levelId: string, count: number, languageId?: string): Promise<TestQuestion[]> {
    const vocab = await this.getVocabulary({ levelId });
    if (vocab.length < 4) return [];

    const shuffled = [...vocab].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    return selected.map(item => {
      const others = vocab.filter(v => v.id !== item.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [item, ...others].sort(() => Math.random() - 0.5);
      
      const targetLang = languageId || 'default';
      const getTranslation = (v: Vocabulary) => 
        v.translations?.[targetLang] || v.word;
      
      return {
        question: `What is "${item.wordKinyarwanda}" in English?`,
        options: options.map(o => getTranslation(o)),
        correctAnswer: options.findIndex(o => o.id === item.id),
      };
    });
  }

  // VIDEOS
  async getVideos(filters?: { levelId?: string; category?: string }): Promise<Video[]> {
    let q = query(this.videosCollection, where('isActive', '==', true));
    if (filters?.levelId) {
      q = query(this.videosCollection, where('levelId', '==', filters.levelId), where('isActive', '==', true));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Video));
    
    if (filters?.category) {
      results = results.filter(r => r.category === filters.category);
    }
    return results;
  }

  async getVideo(id: string): Promise<Video | null> {
    const docRef = doc(this.videosCollection, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Video : null;
  }

  async createVideo(data: Omit<Video, 'id'>): Promise<string> {
    const docRef = await addDoc(this.videosCollection, data);
    return docRef.id;
  }

  async updateVideo(id: string, data: Partial<Video>): Promise<void> {
    await updateDoc(doc(this.videosCollection, id), data);
  }

  async deleteVideo(id: string): Promise<void> {
    await deleteDoc(doc(this.videosCollection, id));
  }

  // POINT HISTORY - Efficient way to track and calculate points
  async addPointHistory(data: Omit<PointHistory, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(this.pointHistoryCollection, {
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  async getPointHistory(userId: string, limitCount: number = 50): Promise<PointHistory[]> {
    const q = query(
      this.pointHistoryCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PointHistory));
  }

  // Get user's points breakdown by type
  async getPointsBreakdown(userId: string): Promise<Record<string, number>> {
    const history = await this.getPointHistory(userId, 500);
    const breakdown: Record<string, number> = {};
    
    history.forEach(item => {
      if (!breakdown[item.type]) {
        breakdown[item.type] = 0;
      }
      breakdown[item.type] += item.points;
    });
    
    return breakdown;
  }

  // Efficiently update user points with history tracking
  async awardPoints(
    userId: string, 
    points: number, 
    reason: string, 
    type: PointHistory['type'],
    relatedId?: string
  ): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    // Add point history
    await this.addPointHistory({
      userId,
      points,
      reason,
      type,
      relatedId,
    });

    // Update user total
    await this.updateUser(userId, {
      totalPoints: (user.totalPoints || 0) + points,
    });
  }

  // Increment specific stats
  async incrementUserStat(userId: string, stat: keyof UserStats): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const currentValue = (user as any)[stat] || 0;
    await this.updateUser(userId, {
      [stat]: currentValue + 1,
    } as any);
  }

  // CATEGORIES
  async getCategories(filters?: { levelId?: string }): Promise<Category[]> {
    let q = query(this.categoriesCollection, orderBy('name'));
    if (filters?.levelId) {
      q = query(this.categoriesCollection, where('levelId', '==', filters.levelId), orderBy('name'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
  }

  async createCategory(data: Omit<Category, 'id'>): Promise<string> {
    const docRef = await addDoc(this.categoriesCollection, data);
    return docRef.id;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<void> {
    await updateDoc(doc(this.categoriesCollection, id), data);
  }

  async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(this.categoriesCollection, id));
  }

  // DIFFICULTIES
  async getDifficulties(): Promise<Difficulty[]> {
    const q = query(this.difficultiesCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Difficulty));
  }

  async createDifficulty(data: Omit<Difficulty, 'id'>): Promise<string> {
    const docRef = await addDoc(this.difficultiesCollection, data);
    return docRef.id;
  }

  async updateDifficulty(id: string, data: Partial<Difficulty>): Promise<void> {
    await updateDoc(doc(this.difficultiesCollection, id), data);
  }

  async deleteDifficulty(id: string): Promise<void> {
    await deleteDoc(doc(this.difficultiesCollection, id));
  }

  // LANGUAGES
  async getLanguages(filters?: { isActive?: boolean }): Promise<Language[]> {
    const q = query(this.languagesCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Language));
    if (filters?.isActive !== undefined) {
      results = results.filter(r => r.isActive === filters.isActive);
    }
    return results;
  }

  async createLanguage(data: Omit<Language, 'id'>): Promise<string> {
    const docRef = await addDoc(this.languagesCollection, data);
    return docRef.id;
  }

  async updateLanguage(id: string, data: Partial<Language>): Promise<void> {
    await updateDoc(doc(this.languagesCollection, id), data);
  }

  async deleteLanguage(id: string): Promise<void> {
    await deleteDoc(doc(this.languagesCollection, id));
  }

  // Get default language
  async getDefaultLanguage(): Promise<Language | null> {
    const q = query(this.languagesCollection, where('isDefault', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Language;
  }
}

export const dbService = new DatabaseService();