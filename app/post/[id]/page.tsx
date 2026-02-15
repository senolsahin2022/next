import type { Metadata } from 'next';
import PostPageClient from './post-page-client';
import { fetchPost } from '@/lib/api/api';

type PageProps = {
  params: {
    id: string;
  };
};

type FaqItem = {
  question: string;
  answer: string;
};

const SITE_NAME = 'CryptoFeed';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getBaseUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://live.crypto-feed.net';

  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return new URL('https://live.crypto-feed.net');
  }
}

function normalizePostResponse(payload: any): any | null {
  if (!payload) return null;
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

  const isPostLike = (item: any) =>
    !!item &&
    !!item.id &&
    (item.content || item.title || item.authorName || item.username || item.cardType || item.videoVO);

  const directCandidates = [
    safePayload,
    safePayload?.data,
    safePayload?.data?.data,
    safePayload?.data?.content,
    safePayload?.content,
    safePayload?.post,
    safePayload?.data?.post,
  ];

  for (const candidate of directCandidates) {
    if (isPostLike(candidate)) return candidate;
  }

  const arrayCandidates = [
    ...(Array.isArray(safePayload?.data) ? safePayload.data : []),
    ...(Array.isArray(safePayload?.data?.data) ? safePayload.data.data : []),
    ...(Array.isArray(safePayload?.data?.vos) ? safePayload.data.vos : []),
    ...(Array.isArray(safePayload?.data?.contents) ? safePayload.data.contents : []),
    ...(Array.isArray(safePayload?.contents) ? safePayload.contents : []),
  ];

  const found = arrayCandidates.find(isPostLike);
  return found || null;
}

function buildFaq(post: any, id: string): FaqItem[] {
  const author = post?.authorName || post?.username || 'this author';
  const hasVideo = !!post?.videoVO?.videoLink || !!post?.videoLink;
  const hashtags = post?.hashtagList?.length || 0;
  const interactions = (post?.likeCount || 0) + (post?.commentCount || 0) + (post?.shareCount || 0);

  return [
    {
      question: `What is this post about?`,
      answer: `This page shows a single crypto post by ${author} with full post details, media, and engagement metrics.`,
    },
    {
      question: `Does this post include media content?`,
      answer: hasVideo
        ? 'Yes. This post includes video content and may also include images.'
        : 'This post is mainly text/image based, depending on attached media fields.',
    },
    {
      question: `How active is this post?`,
      answer: `The post currently has ${interactions.toLocaleString()} total visible interactions and ${hashtags} related hashtags.`,
    },
    {
      question: `How can I reference this post?`,
      answer: `Use the unique post ID (${id}) in the URL to revisit or share this exact content page.`,
    },
  ];
}

async function getPostData(id: string) {
  try {
    const response = await fetchPost(id);
    const post = normalizePostResponse(response);
    return { response, post };
  } catch {
    return { response: null, post: null };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = params.id;
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl.origin}/post/${encodeURIComponent(id)}`;
  const { post } = await getPostData(id);

  const author = post?.authorName || post?.username || 'Crypto author';
  const headline = post?.title || post?.content?.slice?.(0, 80) || `Post ${id}`;
  const title = `${headline} | ${SITE_NAME}`;
  const description =
    (post?.content?.slice?.(0, 160) as string) ||
    `Read this crypto post by ${author} on ${SITE_NAME}. Explore media, hashtags, and engagement details.`;
  const ogImage = post?.coverLight || post?.coverDark || post?.authorAvatar || `${baseUrl.origin}/og-image.svg`;

  return {
    metadataBase: baseUrl,
    title,
    description,
    keywords: [
      'crypto post',
      'crypto discussion',
      author,
      ...(post?.hashtagList || []),
      SITE_NAME,
    ].filter(Boolean),
    alternates: {
      canonical: `/post/${encodeURIComponent(id)}`,
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
      type: 'article',
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: `Post ${id} preview` }],
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

export default async function PostPage({ params }: PageProps) {
  const id = params.id;
  const { response, post } = await getPostData(id);
  const faqItems = buildFaq(post, id);
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

  const articleJsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post?.title || `Post ${id}`,
        description: post?.content?.slice?.(0, 180) || `Crypto post ${id}`,
        author: {
          '@type': 'Person',
          name: post?.authorName || post?.username || 'Unknown',
        },
        image: post?.coverLight || post?.coverDark || post?.authorAvatar || undefined,
        datePublished: post?.date
          ? new Date(post.date * 1000).toISOString()
          : undefined,
        mainEntityOfPage: `${baseUrl.origin}/post/${encodeURIComponent(id)}`,
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <section className="sr-only" aria-label={`Post ${id} snapshot`}>
        <h2>Post Snapshot</h2>
        <p>{post?.title || post?.content || `Post ${id}`}</p>
      </section>
      <PostPageClient id={id} faqItems={faqItems} initialPostData={response} />
    </>
  );
}
