# IJWI-LEARN

A modern web application for learning the Kinyarwanda language. Built with Next.js 16, Firebase, and Tailwind CSS.

## Features

- **4 Progressive Levels**: Beginner (free), Practice ($9.99/mo), Intermediate ($14.99/mo), Fluent ($19.99/mo)
- **Interactive Flashcards**: Learn vocabulary, phrases, and numbers with randomized flashcards
- **AI-Powered Practice**: Simulated conversation scenarios for real-world practice
- **Grammar Lessons**: Structured lessons covering verb conjugation, noun classes, and sentence structure
- **Story Reading**: Sentence-by-sentence stories with multi-language translations
- **Video Lessons**: Curated video content by proficiency level
- **Level Tests**: 10-question assessments (80% to pass) with streak tracking
- **PDF Certificates**: Downloadable certificates upon passing tests
- **Leaderboard**: Real-time rankings based on points and activity
- **Teacher Chat**: Direct messaging with language teachers
- **Admin Panel**: Full CRUD management for all content types
- **Multi-Language Support**: Vocabulary and stories support translations in multiple languages
- **Points System**: Earn points for tests (+10) and passing (+20) with full history tracking
- **SEO Optimized**: Dynamic metadata, sitemap, robots.txt, RSS feed, and LLM context file

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google OAuth)
- **Payments**: Pesapal (credit/debit cards) + PayPack (MTN/Airtel Rwanda)
- **PDF Generation**: html2canvas + jspdf

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_SITE_URL` | Production URL for SEO |
| `PESAPAL_CONSUMER_KEY` | Pesapal API key |
| `PESAPAL_CONSUMER_SECRET` | Pesapal API secret |
| `PAYPACK_CLIENT_ID` | PayPack client ID |
| `PAYPACK_CLIENT_SECRET` | PayPack client secret |

## Project Structure

```
app/                    # App Router pages
├── admin/              # Admin dashboard & sub-pages
│   ├── categories/     # Category management
│   ├── chat/           # Chat monitoring
│   ├── difficulties/   # Difficulty level management
│   ├── languages/      # Translation language management
│   ├── learners/       # Learner management
│   ├── levels/         # Level management
│   ├── stories/        # WYSIWYG story editor
│   └── vocabulary/     # Vocabulary management
├── certificates/       # Certificate viewing & PDF download
├── chat/              # Teacher chat
├── leaderboard/       # User rankings
├── learn/             # Learning levels
│   ├── [slug]/        # Dynamic level pages (vocabulary, flashcards)
├── tests/             # Level tests
├── videos/            # Video lessons
├── payment/           # Payment success/failure
├── feed.xml/          # RSS feed
├── sitemap.ts         # Dynamic sitemap
└── robots.ts          # Robots.txt
components/            # Reusable components
├── Navbar.tsx         # Navigation with user menu
├── PaymentModal.tsx   # Payment integration
└── Certificate.tsx    # PDF certificate component
lib/                   # Core libraries
├── database.ts        # Firestore service with full CRUD
├── content.ts         # Content fetching with caching
├── content-types.ts   # TypeScript interfaces
├── firebase.ts        # Firebase client config
└── certificate.ts     # Certificate PDF generation
context/
└── AuthContext.tsx     # Auth state & user data
```

## Admin Panel

The admin panel at `/admin` provides full content management:

- **Vocabulary**: Add/edit words with multi-language translations, pronunciation, difficulty, and category
- **Stories**: Sentence-by-sentence WYSIWYG editor with per-language translations
- **Levels**: Manage learning levels, pricing, and ordering
- **Categories**: Create and manage vocabulary categories
- **Difficulties**: Configure difficulty levels (beginner, intermediate, advanced, etc.)
- **Languages**: Set up translation languages and default language
- **Learners**: View users and toggle teacher permissions
- **Chat**: Monitor teacher-learner communications

## Firebase Collections

| Collection | Purpose |
|------------|---------|
| `levels` | Learning levels with pricing |
| `vocabulary` | Words with multi-language translations |
| `stories` | Stories with sentence-by-sentence translations |
| `tests` | Pre-written tests with questions |
| `videos` | Video lesson metadata |
| `categories` | Vocabulary categories |
| `difficulties` | Difficulty levels |
| `languages` | Translation languages |
| `certificates` | Earned user certificates |
| `users` | User profiles and stats |
| `pointHistory` | Point transaction log |
| `lessons` | Structured lesson data |

## Design

- **Primary**: #1c4d72 (deep navy)
- **Secondary**: #10B981 (emerald)
- **Accent**: #F59E0B (amber)
- **Font**: Plus Jakarta Sans
- **Layout**: Centered max-w-5xl with fixed navbar

## Deployment

```bash
npm run build
npm start
```

## License

© 2026 IJWI-LEARN
