import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);

  return {
    title: `${title} Level`,
    description: `Learn Kinyarwanda at the ${title.toLowerCase()} level with interactive flashcards, vocabulary, and more.`,
    openGraph: {
      title: `${title} Kinyarwanda - IJWI-LEARN`,
      description: `Master Kinyarwanda at the ${title.toLowerCase()} level with interactive learning tools.`,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
