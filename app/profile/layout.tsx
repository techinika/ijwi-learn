import type { Metadata } from 'next';
import ProfileShell from './ProfileShell';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your IJWI-LEARN profile, view subscriptions and invoices.',
  openGraph: {
    title: 'Profile | IJWI-LEARN',
    description: 'Manage your IJWI-LEARN learning profile.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProfileShell>{children}</ProfileShell>;
}
