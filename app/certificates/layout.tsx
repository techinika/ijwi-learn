import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certificates',
  description: 'View and download your earned Kinyarwanda language certificates. Earn certificates by passing level tests with an 80% or higher score.',
  openGraph: {
    title: 'Kinyarwanda Certificates | IJWI-LEARN',
    description: 'Download your verified Kinyarwanda language certificates as PDF. Earned by passing level tests.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
