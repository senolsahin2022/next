import type { Metadata } from 'next';
import HomePageClient from './home-page-client';
import { fetchRecommended, normalizeRecommendedPosts } from '@/lib/api/api';

const SITE_NAME = 'CryptoFeed';
const SITE_DESCRIPTION =
  'Follow live crypto discussions, trending topics, and community insights on CryptoFeed.';

const faqItems = [
  {
    question: 'What is CryptoFeed home page for?',
    answer:
      'CryptoFeed home page helps you discover the latest crypto discussions and trending community posts in one place.',
  },
  {
    question: 'How do I refresh the feed?',
    answer:
      'Use the Refresh button in the feed header to load the most recent recommended posts.',
  },
  {
    question: 'Can I browse older posts?',
    answer:
      'Yes. Use the Previous and Next pagination controls at the bottom of the feed.',
  },
];

function getBaseUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  const title = `${SITE_NAME} - Live Crypto Feed and Trending Discussions`;
  const ogImage = `${baseUrl.origin}/og-image.png`;

  return {
    metadataBase: baseUrl,
    title,
    description: SITE_DESCRIPTION,
    keywords: [
      'crypto feed',
      'crypto discussions',
      'bitcoin community',
      'trending crypto topics',
      'crypto social app',
      SITE_NAME,
    ],
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description: SITE_DESCRIPTION,
      url: baseUrl.origin,
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: `${SITE_NAME} home feed` }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: SITE_DESCRIPTION,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  let initialRecommendedData: any = null;
  let initialPosts: any[] = [];

  try {
    const recommendedRes = await fetchRecommended(1);
    initialRecommendedData = recommendedRes;
    initialPosts = normalizeRecommendedPosts(recommendedRes);
  } catch {
    initialRecommendedData = null;
    initialPosts = [];
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: initialPosts.slice(0, 10).map((post: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: post?.title || post?.content?.slice?.(0, 120) || `Post ${index + 1}`,
      url: post?.id ? `/post/${post.id}` : '/',
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <section className="sr-only" aria-label="Latest crypto posts snapshot">
        <h2>Latest Crypto Posts Snapshot</h2>
        <ul>
          {initialPosts.slice(0, 10).map((post: any, index: number) => (
            <li key={post?.id || index}>
              {post?.title || post?.content?.slice?.(0, 160) || `Post ${index + 1}`}
            </li>
          ))}
        </ul>
      </section>
      <HomePageClient faqItems={faqItems} initialRecommendedData={initialRecommendedData} />
    </>
  );
}
