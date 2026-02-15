import type { Metadata } from 'next';
import HashtagPageClient from './hashtag-page-client';
import { fetchHashtagPosts } from '@/lib/api/api';

type PageProps = {
  params: {
    tag: string;
  };
};

type FaqItem = {
  question: string;
  answer: string;
};

const SITE_NAME = 'CryptoFeed';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

function normalizeTag(rawTag: string) {
  const decoded = decodeURIComponent(rawTag || '').trim();
  return decoded.replace(/^#/, '');
}

function normalizeHashtagResponse(payload: any): {
  posts: any[];
  relatedHashtags: any[];
  topContent: any | null;
} {
  if (!payload) return { posts: [], relatedHashtags: [], topContent: null };
  const safePayload =
    typeof payload === 'string'
      ? (() => {
          try {
            return JSON.parse(payload);
          } catch {
            return {};
          }
        })()
      : payload;

  const candidates: any[] = [
    ...(Array.isArray(safePayload) ? safePayload : []),
    ...(Array.isArray(safePayload?.data) ? safePayload.data : []),
    ...(Array.isArray(safePayload?.data?.data) ? safePayload.data.data : []),
    ...(Array.isArray(safePayload?.data?.vos) ? safePayload.data.vos : []),
    ...(Array.isArray(safePayload?.data?.contents) ? safePayload.data.contents : []),
    ...(Array.isArray(safePayload?.vos) ? safePayload.vos : []),
    ...(Array.isArray(safePayload?.contents) ? safePayload.contents : []),
  ];

  const isPostLike = (item: any) =>
    !!item &&
    !!item.id &&
    (item.content || item.title || item.authorName || item.username || item.cardType || item.videoVO);
  const isHashtagLike = (item: any) =>
    !!item && (!!item.hashtag || !!item.hashtagId || item.contentCount !== undefined);

  const posts = candidates.filter(isPostLike);
  let relatedHashtags = candidates.filter((item: any) => isHashtagLike(item) && !isPostLike(item));

  const topContent = safePayload?.data?.topContent || safePayload?.topContent || null;
  if (topContent && isPostLike(topContent)) {
    const exists = posts.some((post: any) => post?.id && post.id === topContent.id);
    if (!exists) posts.unshift(topContent);
  }

  if (posts.length === 0 || relatedHashtags.length === 0) {
    const arrays: any[][] = [];
    const walk = (value: any, depth: number) => {
      if (!value || depth > 6) return;
      if (Array.isArray(value)) {
        arrays.push(value);
        value.slice(0, 10).forEach((item) => walk(item, depth + 1));
        return;
      }
      if (typeof value === 'object') {
        Object.values(value).forEach((v) => walk(v, depth + 1));
      }
    };
    walk(safePayload, 0);

    if (posts.length === 0) {
      const bestPostArray = arrays
        .map((arr) => ({ arr, score: arr.filter(isPostLike).length }))
        .sort((a, b) => b.score - a.score)[0];
      if (bestPostArray && bestPostArray.score > 0) {
        posts.push(...bestPostArray.arr.filter(isPostLike));
      }
    }

    if (relatedHashtags.length === 0) {
      const bestHashtagArray = arrays
        .map((arr) => ({ arr, score: arr.filter(isHashtagLike).length }))
        .sort((a, b) => b.score - a.score)[0];
      if (bestHashtagArray && bestHashtagArray.score > 0) {
        relatedHashtags = bestHashtagArray.arr.filter(
          (item: any) => isHashtagLike(item) && !isPostLike(item)
        );
      }
    }
  }

  return { posts, relatedHashtags, topContent };
}

function buildFaq(tag: string, postCount: number, posts: any[]): FaqItem[] {
  const hasVideo = posts.some((post) => !!post.videoVO?.videoLink);
  const hasImage = posts.some((post) => (post.imageList?.length || 0) > 0);

  return [
    {
      question: `What is #${tag} on ${SITE_NAME}?`,
      answer: `#${tag} is a topic feed that collects related crypto discussions and community insights.`,
    },
    {
      question: `How many posts are currently shown for #${tag}?`,
      answer: `This page currently shows ${postCount} posts for #${tag}.`,
    },
    {
      question: `What content types can appear in #${tag}?`,
      answer: `Posts may include text${hasImage ? ', images' : ''}${hasVideo ? ', and video' : ''} depending on what users share.`,
    },
  ];
}

async function getHashtagData(tag: string) {
  try {
    const primaryResponse = await fetchHashtagPosts(tag);
    const primaryNormalized = normalizeHashtagResponse(primaryResponse);

    if (primaryNormalized.posts.length > 0 || primaryNormalized.relatedHashtags.length > 0) {
      return { response: primaryResponse, ...primaryNormalized };
    }

    const fallbackResponse = await fetchHashtagPosts(`#${tag}`);
    const fallbackNormalized = normalizeHashtagResponse(fallbackResponse);
    return { response: fallbackResponse, ...fallbackNormalized };
  } catch {
    return {
      response: null,
      posts: [] as any[],
      relatedHashtags: [] as any[],
      topContent: null as any,
    };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = normalizeTag(params.tag);
  const { posts, relatedHashtags } = await getHashtagData(tag);
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl.origin}/hashtag/${encodeURIComponent(tag)}`;

  const title = `#${tag} Crypto Posts, Trends and Community Discussion | ${SITE_NAME}`;
  const resultCount = posts.length || relatedHashtags.length;
  const description = `Track #${tag} on ${SITE_NAME}. Explore ${resultCount} related results, live conversations, and crypto market sentiment.`;
  const ogImage = `${baseUrl.origin}/og-image.png`;

  return {
    metadataBase: baseUrl,
    title,
    description,
    keywords: [
      `#${tag}`,
      `${tag} crypto`,
      `${tag} discussions`,
      'crypto hashtag',
      'crypto community',
      SITE_NAME,
    ],
    alternates: {
      canonical: `/hashtag/${encodeURIComponent(tag)}`,
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
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: `${SITE_NAME} hashtag feed for #${tag}` }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HashtagPage({ params }: PageProps) {
  const tag = normalizeTag(params.tag);
  const { response, posts, relatedHashtags } = await getHashtagData(tag);
  const faqItems = buildFaq(tag, posts.length, posts);
  const baseUrl = getBaseUrl();

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
    itemListElement: posts.slice(0, 10).map((post: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: post?.title || post?.content?.slice?.(0, 120) || `#${tag} post ${index + 1}`,
      url: post?.id ? `${baseUrl.origin}/post/${post.id}` : `${baseUrl.origin}/hashtag/${tag}`,
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
      <section className="sr-only" aria-label={`Latest posts for hashtag ${tag}`}>
        <h2>Latest posts for #{tag}</h2>
        <ul>
          {posts.slice(0, 10).map((post: any, index: number) => (
            <li key={post?.id || index}>
              {post?.title || post?.content?.slice?.(0, 160) || `#${tag} post ${index + 1}`}
            </li>
          ))}
        </ul>
      </section>
      <HashtagPageClient
        tag={tag}
        faqItems={faqItems}
        initialHashtagData={response}
        initialRelatedHashtags={relatedHashtags}
      />
    </>
  );
}
