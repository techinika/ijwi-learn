import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Failed',
  description: 'Your IJWI-LEARN payment did not go through. Please try again or use a different payment method.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
