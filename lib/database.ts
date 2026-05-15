import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, Unsubscribe, serverTimestamp, writeBatch, Timestamp
} from 'firebase/firestore';

export interface Level {
  id: string;
  slug?: string;
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
  slug?: string;
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
  slug?: string;
  levelId: string;
  title: string;
  titleTranslations: Record<string, string>;
  difficulty: string;
  category: string;
  sentences: StorySentence[];
  content: string;
  coverImage?: string;
  isActive: boolean;
}

export interface Test {
  id: string;
  slug?: string;
  levelId: string;
  title: string;
  questions: TestQuestion[];
  difficulty: string;
  passingScore: number;
}

export interface TestQuestion {
  question: string;
  questionTranslations?: Record<string, string>;
  options: string[];
  optionsTranslations?: Record<string, string>[];
  correctAnswer: number;
}

export interface Lesson {
  id: string;
  slug?: string;
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
  difficulty: string;
  score: number;
  completedAt: Date;
  certificateId: string;
}

export interface Video {
  id: string;
  slug?: string;
  levelId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  isActive: boolean;
}

export interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  levelIds: string[];
  order: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  levelId: string;
  levelTitle: string;
  levelSlug: string;
  levelPrice: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  reminderSent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  subscriptionId: string;
  levelId: string;
  levelTitle: string;
  levelSlug: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  paidAt?: Date;
  transactionId?: string;
  paymentMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PointHistory {
  id: string;
  userId: string;
  points: number;
  reason: string;
  type: 'test' | 'vocabulary' | 'practice' | 'streak' | 'certificate' | 'merit' | 'other';
  relatedId?: string | null;
  createdAt: Date;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  levelId: string;
  levelTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  answers: (number | null)[];
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
  levelIds: string[];
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

export interface ChatMessage {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  role: 'learner' | 'teacher';
  timestamp: Date | { toDate(): Date };
  read: boolean;
}

export interface ChatThread {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  learnerPhoto?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
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

class DatabaseService {
  private levelsCollection = collection(db, 'levels');
  private vocabularyCollection = collection(db, 'vocabulary');
  private storiesCollection = collection(db, 'stories');
  private testsCollection = collection(db, 'tests');
  private lessonsCollection = collection(db, 'lessons');
  private usersCollection = collection(db, 'users');
  private certificatesCollection = collection(db, 'certificates');
  private videosCollection = collection(db, 'videos');
  private videoCommentsCollection = collection(db, 'videoComments');
  private pointHistoryCollection = collection(db, 'pointHistory');
  private categoriesCollection = collection(db, 'categories');
  private difficultiesCollection = collection(db, 'difficulties');
  private languagesCollection = collection(db, 'languages');
  private chatMessagesCollection = collection(db, 'chatMessages');
  private videoCategoriesCollection = collection(db, 'videoCategories');
  private subscriptionsCollection = collection(db, 'subscriptions');
  private invoicesCollection = collection(db, 'invoices');
  private dialoguesCollection = collection(db, 'dialogues');
  private testAttemptsCollection = collection(db, 'testAttempts');

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
  async getVocabulary(filters?: { levelIds?: string[]; levelId?: string; difficulty?: string; category?: string }): Promise<Vocabulary[]> {
    let q = query(this.vocabularyCollection, orderBy('word'));
    if (filters?.levelId) {
      q = query(this.vocabularyCollection, where('levelId', '==', filters.levelId), orderBy('word'));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vocabulary));
    
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(r => filters.levelIds!.includes(r.levelId));
    }
    if (filters?.difficulty) {
      results = results.filter(r => r.difficulty === filters.difficulty);
    }
    if (filters?.category) {
      results = results.filter(r => r.category === filters.category || r.category === filters.category);
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
  async getStories(filters?: { levelId?: string; levelIds?: string[]; difficulty?: string }): Promise<Story[]> {
    let q = query(this.storiesCollection, orderBy('title'));
    if (filters?.levelId) {
      q = query(this.storiesCollection, where('levelId', '==', filters.levelId), orderBy('title'));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story));
    
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(r => filters.levelIds!.includes(r.levelId));
    }
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

  // DIALOGUES
  async getDialogues(filters?: { levelId?: string; levelIds?: string[]; difficulty?: string; isActive?: boolean }): Promise<Dialogue[]> {
    let q = query(this.dialoguesCollection, orderBy('title'));
    if (filters?.levelId) {
      q = query(this.dialoguesCollection, where('levelId', '==', filters.levelId), orderBy('title'));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Dialogue));
    
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(r => filters.levelIds!.includes(r.levelId));
    }
    if (filters?.difficulty) {
      results = results.filter(r => r.difficulty === filters.difficulty);
    }
    if (filters?.isActive !== undefined) {
      results = results.filter(r => r.isActive === filters.isActive);
    }
    return results;
  }

  async getDialogue(id: string): Promise<Dialogue | null> {
    const docSnap = await getDoc(doc(this.dialoguesCollection, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Dialogue;
  }

  async createDialogue(data: Omit<Dialogue, 'id'>): Promise<string> {
    const docRef = await addDoc(this.dialoguesCollection, data);
    return docRef.id;
  }

  async updateDialogue(id: string, data: Partial<Dialogue>): Promise<void> {
    await updateDoc(doc(this.dialoguesCollection, id), data);
  }

  async deleteDialogue(id: string): Promise<void> {
    await deleteDoc(doc(this.dialoguesCollection, id));
  }

  // TESTS
  async getTests(filters?: { levelId?: string; levelIds?: string[]; difficulty?: string }): Promise<Test[]> {
    let q = query(this.testsCollection);
    if (filters?.levelId) {
      q = query(this.testsCollection, where('levelId', '==', filters.levelId));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Test));
    
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(r => filters.levelIds!.includes(r.levelId));
    }
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
    const q = query(this.usersCollection, orderBy('totalPoints', 'desc'), limit(18));
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
    return snapshot.docs.map(d => {
      const data = d.data();
      let completedAt: Date;
      const raw = data.completedAt;
      if (raw instanceof Date) {
        completedAt = raw;
      } else if (raw && typeof raw === 'object' && 'seconds' in raw) {
        completedAt = new Date((raw as any).seconds * 1000);
      } else {
        completedAt = new Date(raw as any);
      }
      return { id: d.id, ...data, completedAt } as Certificate;
    });
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
  async getVideos(filters?: { levelId?: string; levelIds?: string[]; category?: string; isActive?: boolean }): Promise<Video[]> {
    let q = query(this.videosCollection, where('isActive', '==', true));
    if (filters?.levelId) {
      q = query(this.videosCollection, where('levelId', '==', filters.levelId), where('isActive', '==', true));
    }
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Video));
    
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(r => filters.levelIds!.includes(r.levelId));
    }
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

  async getVideoComments(videoId: string): Promise<VideoComment[]> {
    const q = query(
      this.videoCommentsCollection,
      where('videoId', '==', videoId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp).toDate(),
    })) as VideoComment[];
  }

  async addVideoComment(data: Omit<VideoComment, 'id'>): Promise<string> {
    const docRef = await addDoc(this.videoCommentsCollection, data);
    return docRef.id;
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
      relatedId: relatedId || null,
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
  async getCategories(filters?: { levelId?: string; levelIds?: string[] }): Promise<Category[]> {
    const q = query(this.categoriesCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    if (filters?.levelId) {
      results = results.filter(c => c.levelIds?.includes(filters.levelId!));
    }
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(c => c.levelIds?.some(id => filters.levelIds!.includes(id)));
    }
    return results;
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
  async getDifficulties(filters?: { levelId?: string; levelIds?: string[] }): Promise<Difficulty[]> {
    const q = query(this.difficultiesCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Difficulty));
    if (filters?.levelId) {
      results = results.filter(d => d.levelIds?.includes(filters.levelId!));
    }
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(d => d.levelIds?.some(id => filters.levelIds!.includes(id)));
    }
    return results;
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

  // VIDEO CATEGORIES
  async getVideoCategories(filters?: { isActive?: boolean; levelId?: string; levelIds?: string[] }): Promise<VideoCategory[]> {
    const q = query(this.videoCategoriesCollection, orderBy('order'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VideoCategory));
    if (filters?.isActive !== undefined) {
      results = results.filter(r => r.isActive === filters.isActive);
    }
    if (filters?.levelId) {
      results = results.filter(c => c.levelIds?.includes(filters.levelId!));
    }
    if (filters?.levelIds && filters.levelIds.length > 0) {
      results = results.filter(c => c.levelIds?.some(id => filters.levelIds!.includes(id)));
    }
    return results;
  }

  async createVideoCategory(data: Omit<VideoCategory, 'id'>): Promise<string> {
    const docRef = await addDoc(this.videoCategoriesCollection, data);
    return docRef.id;
  }

  async updateVideoCategory(id: string, data: Partial<VideoCategory>): Promise<void> {
    await updateDoc(doc(this.videoCategoriesCollection, id), data);
  }

  async deleteVideoCategory(id: string): Promise<void> {
    await deleteDoc(doc(this.videoCategoriesCollection, id));
  }

  // CHAT MESSAGES
  async sendChatMessage(data: Omit<ChatMessage, 'id'>): Promise<string> {
    const docRef = await addDoc(this.chatMessagesCollection, {
      ...data,
      timestamp: serverTimestamp(),
      read: false,
    });
    return docRef.id;
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    const q = query(
      this.chatMessagesCollection,
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
      } as ChatMessage;
    });
  }

  async getAllChatThreads(): Promise<ChatThread[]> {
    const q = query(this.chatMessagesCollection, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const threadMap = new Map<string, ChatThread>();

    const toDate = (ts: Timestamp | Date | undefined) => {
      if (!ts) return new Date();
      if (ts instanceof Timestamp) return ts.toDate();
      if (ts instanceof Date) return ts;
      return new Date();
    };

    for (const doc of snapshot.docs) {
      const msg = doc.data() as ChatMessage;
      if (!threadMap.has(msg.userId)) {
        threadMap.set(msg.userId, {
          id: msg.userId,
          learnerId: msg.userId,
          learnerName: msg.userName,
          learnerEmail: msg.userEmail,
          learnerPhoto: '',
          lastMessage: msg.content,
          lastMessageTime: toDate(msg.timestamp as Timestamp | Date),
          unreadCount: 0,
        });
      }
      const thread = threadMap.get(msg.userId)!;
      if (!msg.read && msg.role === 'learner') {
        thread.unreadCount++;
      }
      if (msg.timestamp) {
        const msgTime = toDate(msg.timestamp as Timestamp | Date);
        if (msgTime > thread.lastMessageTime!) {
          thread.lastMessage = msg.content;
          thread.lastMessageTime = msgTime;
        }
      }
    }

    return Array.from(threadMap.values()).sort((a, b) =>
      (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0)
    );
  }

  async markMessagesAsRead(userId: string): Promise<void> {
    const q = query(
      this.chatMessagesCollection,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  // SUBSCRIPTIONS
  async getSubscriptions(filters?: { userId?: string; status?: string }): Promise<Subscription[]> {
    let q = query(this.subscriptionsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate?.seconds * 1000),
        endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate?.seconds * 1000),
        nextBillingDate: data.nextBillingDate?.toDate ? data.nextBillingDate.toDate() : new Date(data.nextBillingDate?.seconds * 1000),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      } as Subscription;
    });
    if (filters?.userId) {
      results = results.filter(r => r.userId === filters.userId);
    }
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    return results;
  }

  async getSubscription(id: string): Promise<Subscription | null> {
    const docSnap = await getDoc(doc(this.subscriptionsCollection, id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(),
      endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(),
      nextBillingDate: data.nextBillingDate?.toDate ? data.nextBillingDate.toDate() : new Date(),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    } as Subscription;
  }

  async getActiveSubscription(userId: string, levelId: string): Promise<Subscription | null> {
    const q = query(
      this.subscriptionsCollection,
      where('userId', '==', userId),
      where('levelId', '==', levelId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(),
      endDate: data.endDate?.toDate ? data.endDate.toDate() : new Date(),
      nextBillingDate: data.nextBillingDate?.toDate ? data.nextBillingDate.toDate() : new Date(),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    } as Subscription;
  }

  async createSubscription(data: Omit<Subscription, 'id'>): Promise<string> {
    const docRef = await addDoc(this.subscriptionsCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<void> {
    await updateDoc(doc(this.subscriptionsCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async cancelSubscription(id: string): Promise<void> {
    await updateDoc(doc(this.subscriptionsCollection, id), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  }

  // INVOICES
  async getInvoices(filters?: { userId?: string; status?: string; subscriptionId?: string }): Promise<Invoice[]> {
    let q = query(this.invoicesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        billingPeriodStart: data.billingPeriodStart?.toDate ? data.billingPeriodStart.toDate() : new Date(),
        billingPeriodEnd: data.billingPeriodEnd?.toDate ? data.billingPeriodEnd.toDate() : new Date(),
        paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      } as Invoice;
    });
    if (filters?.userId) {
      results = results.filter(r => r.userId === filters.userId);
    }
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters?.subscriptionId) {
      results = results.filter(r => r.subscriptionId === filters.subscriptionId);
    }
    return results;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const docSnap = await getDoc(doc(this.invoicesCollection, id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      billingPeriodStart: data.billingPeriodStart?.toDate ? data.billingPeriodStart.toDate() : new Date(),
      billingPeriodEnd: data.billingPeriodEnd?.toDate ? data.billingPeriodEnd.toDate() : new Date(),
      paidAt: data.paidAt?.toDate ? data.paidAt.toDate() : undefined,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    } as Invoice;
  }

  async createInvoice(data: Omit<Invoice, 'id'>): Promise<string> {
    const docRef = await addDoc(this.invoicesCollection, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
    await updateDoc(doc(this.invoicesCollection, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async markInvoicePaid(id: string, transactionId: string, paymentMethod: string): Promise<void> {
    await updateDoc(doc(this.invoicesCollection, id), {
      status: 'paid',
      paidAt: serverTimestamp(),
      transactionId,
      paymentMethod,
      updatedAt: serverTimestamp(),
    });
  }

  async generateInvoiceNumber(): Promise<string> {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  }

  // TEST ATTEMPTS
  async getTestAttempts(userId: string): Promise<TestAttempt[]> {
    const q = query(
      this.testAttemptsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as TestAttempt;
    });
  }

  async createTestAttempt(data: Omit<TestAttempt, 'id'>): Promise<string> {
    const docRef = await addDoc(this.testAttemptsCollection, data);
    return docRef.id;
  }

  async getAllTestAttempts(filters?: { levelId?: string }): Promise<TestAttempt[]> {
    let q = query(this.testAttemptsCollection, orderBy('createdAt', 'desc'));
    if (filters?.levelId) {
      q = query(this.testAttemptsCollection, where('levelId', '==', filters.levelId), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      } as TestAttempt;
    });
  }
}

export const dbService = new DatabaseService();