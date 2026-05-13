import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fluent Level',
  description: 'Read Kinyarwanda stories to improve your reading comprehension and fluency. Stories are randomly selected from the database with varying difficulty levels.',
  openGraph: {
    title: 'Fluent Kinyarwanda - Stories & Comprehension | IJWI-LEARN',
    description: 'Improve your Kinyarwanda reading comprehension with stories at beginner, intermediate, and advanced difficulty levels.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
