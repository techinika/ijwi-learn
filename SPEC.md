# IJWI-LEARN - Kinyarwanda Learning Platform

## Project Overview
- **Project Name**: IJWI-LEARN (I Know - Learn)
- **Type**: Web Application (Next.js 16 + React 19 + Tailwind CSS)
- **Core Functionality**: A comprehensive Kinyarwanda language learning platform with multiple proficiency levels, AI-powered practice, video content, testing, and certification
- **Target Users**: People learning Kinyarwanda at various levels - beginners, intermediate learners, and fluent speakers seeking advancement

## UI/UX Specification

### Layout Structure
- **Navigation**: Fixed top bar with logo, level indicator, user profile dropdown, and chat with teacher button
- **Main Content**: Full-width content area with generous padding (64px desktop, 24px mobile)
- **Sidebar**: Collapsible left sidebar for navigation within levels (280px width)
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Visual Design

#### Color Palette
- **Primary**: `#2563EB` (Royal Blue - trust, learning)
- **Primary Dark**: `#1D4ED8`
- **Secondary**: `#10B981` (Emerald - growth, success)
- **Accent**: `#F59E0B` (Amber - achievement, energy)
- **Background**: `#FAFAFA` (Light gray)
- **Surface**: `#FFFFFF`
- **Text Primary**: `#1F2937` (Dark gray)
- **Text Secondary**: `#6B7280` (Medium gray)
- **Error**: `#EF4444`
- **Success**: `#22C55E`

#### Typography
- **Font Family**: "Plus Jakarta Sans" (modern, clean, accessible)
- **Heading XL**: 48px, font-weight 700, line-height 1.2
- **Heading L**: 32px, font-weight 600, line-height 1.3
- **Heading M**: 24px, font-weight 600, line-height 1.4
- **Body Large**: 20px, font-weight 400, line-height 1.6
- **Body**: 18px, font-weight 400, line-height 1.6
- **Body Small**: 16px, font-weight 400, line-height 1.5
- **Caption**: 14px, font-weight 500, line-height 1.4

#### Spacing System
- **Base Unit**: 8px
- **Spacing Scale**: 8, 16, 24, 32, 48, 64, 96, 128
- **Container Max Width**: 1440px
- **Content Max Width**: 1024px

#### Visual Effects
- **Card Shadow**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **Elevated Shadow**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **Border Radius**: 8px (small), 16px (medium), 24px (large), 9999px (pill)
- **Transitions**: 200ms ease-in-out (default), 300ms ease-out (page transitions)

### Accessibility Requirements
- Minimum contrast ratio: 4.5:1 for text
- Large fonts (18px minimum for body text)
- Clear focus indicators
- Screen reader friendly labels
- Keyboard navigation support

---

## Functionality Specification

### User Levels

#### 1. Beginner Level (Level 1)
- **Description**: Learning the basics
- **Features**:
  - Basic vocabulary (100 most common words)
  - Greetings and phrases
  - Numbers 1-100
  - Simple sentences
  - Pronunciation guides with audio
  - Interactive flashcards
- **Price**: Free (introductory)

#### 2. Practice Level (Level 2)
- **Description**: AI-powered conversation practice
- **Features**:
  - AI chat partner for conversation
  - Scenario-based dialogues
  - Grammar correction
  - Vocabulary suggestions
  - Speaking practice with speech recognition
- **Price**: $9.99/month

#### 3. Intermediate Level (Level 3)
- **Description**: Vocabulary expansion and grammar rules
- **Features**:
  - 500+ vocabulary words with contexts
  - Grammar rules tutorials
  - Verb conjugations
  - Sentence structure patterns
  - Reading comprehension exercises
- **Price**: $14.99/month

#### 4. Fluent Level (Level 4)
- **Description**: Stories, texts, and advanced content
- **Features**:
  - Rwandan stories and folktales
  - News articles (simplified)
  - Cultural content
  - Advanced discussions
  - Literature excerpts
- **Price**: $19.99/month

### Core Features

#### Authentication
- Google OAuth only (via Firebase Auth)
- Automatic user profile creation in Firestore
- Session persistence

#### Navigation
- Dashboard showing all 4 levels as cards
- Progress indicators per level
- Locked levels shown with upgrade prompt
- Level completion badges

#### Video Learning
- Embedded video player (YouTube/Vimeo style)
- Video lessons per level
- Progress tracking
- Transcript view

#### Tests & Certifications
- Quiz format for each level
- Minimum 80% to pass
- 3 attempts per test
- Digital certificates on completion
- Certificate ID for verification

#### Teacher Chat
- Real-time chat with teachers
- Message history stored in Firestore
- Notification system
- Quick help button always visible

#### Payment System
- Stripe integration (mock for demo)
- Level-based pricing
- Subscription model
- Payment required to unlock levels 2-4

### Data Structure (Firestore)

#### Users Collection
```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - currentLevel: number (1-4)
  - purchasedLevels: number[]
  - createdAt: timestamp
  - certificateIds: string[]
```

#### Levels Collection
```
levels/{levelId}
  - title: string
  - description: string
  - price: number
  - topics: topic[]
  - test: test
  - videos: video[]
```

#### Progress Collection
```
progress/{userId}_{levelId}
  - completedTopics: string[]
  - quizScores: number[]
  - videoProgress: number[]
  - updatedAt: timestamp
```

#### Certificates Collection
```
certificates/{certificateId}
  - userId: string
  - levelId: number
  - score: number
  - issuedAt: timestamp
  - certificateNumber: string
```

#### Chat Collection
```
chats/{chatId}
  - userId: string
  - teacherId: string
  - messages: message[]
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

## Page Structure

### Public Pages
1. **Landing Page** (`/`) - Level selection dashboard, login prompt

### Protected Pages (Require Auth)
2. **Login** (`/login`) - Google sign-in only
3. **Level Page** (`/learn/[slug]`) - Dynamic level pages with vocabulary flashcards
7. **Videos** (`/videos`) - Video library
8. **Tests** (`/tests/[levelId]`) - Level tests
9. **Certificates** (`/certificates`) - User certificates
10. **Chat** (`/chat`) - Teacher chat interface

---

## Component List

### Layout Components
- `Navbar` - Top navigation with logo, user menu
- `Sidebar` - Level navigation
- `Footer` - Minimal footer

### UI Components
- `Button` - Primary, secondary, outline variants
- `Card` - Content cards with hover states
- `Input` - Text input with labels
- `Modal` - Popup modals
- `Badge` - Status badges
- `ProgressBar` - Progress indicators
- `VideoPlayer` - Embedded video player
- `ChatWindow` - Chat interface
- `Flashcard` - Vocabulary flashcards

### Feature Components
- `LevelCard` - Level selection cards
- `VocabularyItem` - Word display with audio
- `QuizQuestion` - Quiz question display
- `CertificateCard` - Certificate display

---

## Acceptance Criteria

### Authentication
- [ ] Users can sign in with Google
- [ ] Users cannot access protected pages without login
- [ ] User profile created in Firestore on first login
- [ ] Session persists across browser refresh

### Level Access
- [ ] Beginner level accessible to all users (free)
- [ ] Levels 2-4 require purchase
- [ ] Locked levels show upgrade prompt
- [ ] Purchased levels accessible immediately

### Learning Features
- [ ] Vocabulary displayed with large, readable fonts
- [ ] Audio pronunciation available
- [ ] AI chat responds to user messages
- [ ] Video lessons play correctly
- [ ] Progress tracked and displayed

### Tests & Certificates
- [ ] Tests can be completed online
- [ ] Score calculated correctly
- [ ] Certificate generated on 80%+ pass
- [ ] Certificate shows user name, level, date

### Teacher Chat
- [ ] Chat opens in new section
- [ ] Messages sent and received
- [ ] Chat history persisted

### Payments
- [ ] Payment modal shows for locked levels
- [ ] Successful payment unlocks level
- [ ] Payment status saved to user profile

### Design & Performance
- [ ] All text minimum 18px
- [ ] Pages load under 3 seconds
- [ ] Responsive on all devices
- [ ] Modern, clean aesthetic
- [ ] Accessible to screen readers