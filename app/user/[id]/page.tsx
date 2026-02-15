import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  Link as LinkIcon,
  MessageSquare,
  Repeat,
  Share2,
} from 'lucide-react';
import { HotList } from '@/components/feed/hot-list';
import { fetchUser, fetchUserList } from '@/lib/api/api';

type PageProps = {
  params: {
    id: string;
  };
};

type ProfileData = {
  user: any | null;
  posts: any[];
};

type FaqItem = {
  question: string;
  answer: string;
};

const SITE_NAME = 'CryptoFeed';
export const runtime = 'edge';

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

const getProfileData = cache(async (id: string): Promise<ProfileData> => {
  try {
    const userRes = await fetchUser(id);
    const user = (userRes as any)?.data || null;

    if (!user?.squareUid) {
      return { user, posts: [] };
    }

    const postsRes = await fetchUserList(user.squareUid);
    const posts = (postsRes as any)?.data?.contents || [];
    return { user, posts };
  } catch {
    return { user: null, posts: [] };
  }
});

function buildDynamicFaq(user: any | null, posts: any[]): FaqItem[] {
  const postCount = posts.length;
  const hasVideo = posts.some((post) => !!post.videoVO?.videoLink);
  const hasImages = posts.some((post) => (post.imageList?.length || 0) > 0);
  const hasQuotes = posts.some((post) => !!post.quotedContent);
  const isVerified = user?.authorVerificationType === 1;
  const profileName = user?.displayName || user?.username || 'this user';
  const followerCount = user?.totalFollowerCount || 0;

  return [
    {
      question: `What can I find on ${profileName}'s profile page?`,
      answer: `${profileName}'s profile includes bio details, follower stats, and ${postCount} recent public posts.`,
    },
    {
      question: 'Is this account verified?',
      answer: isVerified
        ? 'Yes. The account is marked as verified with a visible verification badge.'
        : 'No verification badge is currently shown for this account.',
    },
    {
      question: 'What type of content is published here?',
      answer: `This feed includes text posts${hasImages ? ', images' : ''}${hasQuotes ? ', quote posts' : ''}${hasVideo ? ', and videos' : ''}.`,
    },
    {
      question: 'How active is this profile?',
      answer: `The profile currently has ${followerCount.toLocaleString()} followers and ${postCount} visible posts on this page.`,
    },
  ];
}

function getDisplayName(user: any | null, id: string) {
  return user?.displayName || user?.username || `User ${id}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = params.id;
  const baseUrl = getBaseUrl();
  const profileUrl = `${baseUrl.origin}/user/${id}`;
  const { user, posts } = await getProfileData(id);

  const name = getDisplayName(user, id);
  const username = user?.username ? `@${user.username}` : '';
  const postCount = posts.length;
  const followerCount = user?.totalFollowerCount || 0;

  const title = `${name} ${username} Profile, Posts and Stats | ${SITE_NAME}`;
  const description = `${name}'s crypto social profile on ${SITE_NAME}. View ${postCount} posts, follower stats (${followerCount.toLocaleString()}), and the latest activity.`;
  const image = user?.avatar || `${baseUrl.origin}/default-avatar.png`;

  return {
    metadataBase: baseUrl,
    applicationName: SITE_NAME,
    title,
    description,
    keywords: [
      `${name} profile`,
      user?.username,
      'crypto profile',
      'crypto social feed',
      'crypto posts',
      'crypto community',
      SITE_NAME,
    ].filter(Boolean) as string[],
    category: 'Cryptocurrency',
    alternates: {
      canonical: `/user/${id}`,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'profile',
      url: profileUrl,
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, alt: `${name} profile avatar` }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: user?.username ? `@${user.username}` : undefined,
      images: [image],
    },
  };
}

export default async function UserPage({ params }: PageProps) {
  const id = params.id;
  const baseUrl = getBaseUrl();
  const profileUrl = `${baseUrl.origin}/user/${id}`;
  const { user, posts } = await getProfileData(id);

  const profileName = getDisplayName(user, id);
  const faqItems = buildDynamicFaq(user, posts);
  const postCount = posts.length;

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

  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: profileUrl,
    name: `${profileName} Profile`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: baseUrl.origin,
    },
    mainEntity: {
      '@type': 'Person',
      name: profileName,
      alternateName: user?.username ? `@${user.username}` : undefined,
      image: user?.avatar || undefined,
      description: user?.biography || `${profileName} profile on ${SITE_NAME}`,
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'FollowAction' },
          userInteractionCount: user?.totalFollowerCount || 0,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WriteAction' },
          userInteractionCount: user?.totalListedPostCount || postCount,
        },
      ],
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl.origin,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Users',
        item: `${baseUrl.origin}/user`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: profileName,
        item: profileUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
          <div className="lg:col-span-2 space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Geri
            </Link>

            {user ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600" />

                <div className="px-6 pb-6">
                  <div className="-mt-16 mb-4">
                    <Image
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.displayName || 'Profil'}
                      width={96}
                      height={96}
                      className="rounded-full border-4 border-black object-cover"
                    />
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-white">
                        {profileName} Profile
                      </h1>
                      {user.authorVerificationType === 1 && (
                        <span className="text-green-400 text-sm font-medium">Verified</span>
                      )}
                    </div>
                    <p className="text-neutral-500">@{user.username}</p>
                  </div>

                  {user.biography && <p className="text-neutral-300 mb-5">{user.biography}</p>}

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
                    <div>
                      <span className="font-bold text-white">{user.totalFollowCount || 0}</span>
                      <span className="ml-1.5 text-neutral-500">Takip Edilen</span>
                    </div>
                    <div>
                      <span className="font-bold text-white">{user.totalFollowerCount || 0}</span>
                      <span className="ml-1.5 text-neutral-500">Takipçi</span>
                    </div>
                    <div>
                      <span className="font-bold text-white">
                        {user.totalListedPostCount || posts.length}
                      </span>
                      <span className="ml-1.5 text-neutral-500">Gönderi</span>
                    </div>
                  </div>

                  {user.createTime && (
                    <div className="text-sm text-neutral-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Katılım:{' '}
                      {formatDistanceToNow(new Date(user.createTime), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-neutral-400">
                Kullanıcı bilgisi alınamadı.
              </div>
            )}

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
              <div className="border-b border-neutral-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Gönderiler</h2>
              </div>

              {posts.length > 0 ? (
                <div className="divide-y divide-neutral-800">
                  {posts.map((post: any) => {
                    const timeAgo = formatDistanceToNow(
                      new Date(post.firstReleaseTime || post.createTime),
                      { addSuffix: true, locale: tr }
                    );

                    const hasImage = post.imageList?.length > 0;
                    const hasQuote = !!post.quotedContent;
                    const hasTrading = post.tradingPairsV2?.length > 0;
                    const hasVideo = !!post.videoVO?.videoLink;
                    const isVerified = post.authorVerificationType === 1;
                    const hasLabels = post.userLabels?.length > 0;
                    const hasShareLinks = post.shareLink || post.webLink;

                    return (
                      <div key={post.id} className="p-5 hover:bg-neutral-950/40 transition-colors">
                        <div className="flex gap-4">
                          <Image
                            src={post.avatar || '/default-avatar.png'}
                            alt={post.displayName || 'Kullanıcı'}
                            width={48}
                            height={48}
                            className="rounded-full object-cover flex-shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-bold text-white">{post.displayName}</span>
                              {isVerified && <span className="text-blue-500 text-sm">Onaylı</span>}
                              <span className="text-neutral-500 text-sm">
                                @{post.username} . {timeAgo}
                              </span>
                              {hasLabels && post.userLabels[0] && (
                                <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
                                  {post.userLabels[0].name}
                                </span>
                              )}
                            </div>

                            <p className="text-white mb-3 whitespace-pre-wrap leading-relaxed">
                              {post.bodyTextOnly}
                            </p>

                            {hasImage && (
                              <div className="rounded-2xl overflow-hidden border border-neutral-700 mb-3">
                                <Image
                                  src={post.imageList[0]}
                                  alt="Gönderi görseli"
                                  width={post.imageMetaList?.[0]?.width || 600}
                                  height={post.imageMetaList?.[0]?.height || 400}
                                  className="w-full h-auto object-cover max-h-[520px]"
                                />
                                {post.imageList.length > 1 && (
                                  <div className="text-xs text-neutral-400 bg-neutral-900/70 px-3 py-1.5">
                                    +{post.imageList.length - 1} görsel daha
                                  </div>
                                )}
                              </div>
                            )}

                            {hasQuote && (
                              <div className="border border-neutral-700 rounded-xl p-4 mb-4 bg-neutral-950/60">
                                <p className="text-sm text-neutral-200 mb-2">
                                  {post.quotedContent.bodyTextOnly ||
                                    post.quotedContent.body ||
                                    'Alıntı içeriği'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span>
                                    @{post.quotedContent.username || post.quotedContent.displayName}
                                  </span>
                                  <span>.</span>
                                  <span>{post.quotedContent.likeCount || 0} beğeni</span>
                                </div>
                              </div>
                            )}

                            {hasTrading && (
                              <div className="bg-neutral-900/70 rounded-lg p-3 mb-3 text-sm border border-neutral-800">
                                <div className="flex flex-wrap gap-4">
                                  {post.tradingPairsV2.map((pair: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <span className="font-medium text-white">
                                        {pair.code || pair.symbol}
                                      </span>
                                      <span className="text-emerald-400">
                                        {pair.price || pair.priceRaw}
                                      </span>
                                      <span
                                        className={`text-xs ${
                                          pair.priceChange?.startsWith('-')
                                            ? 'text-red-400'
                                            : 'text-emerald-400'
                                        }`}
                                      >
                                        {pair.priceChange ||
                                          pair.priceChangeChart?.[
                                            pair.priceChangeChart.length - 1
                                          ]?.value ||
                                          ''}
                                        %
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {hasVideo && (
                              <div className="mb-4 rounded-xl overflow-hidden border border-neutral-700 bg-black">
                                <video controls className="w-full" poster={post.imageList?.[0] || undefined}>
                                  <source src={post.videoVO.videoLink} type="video/mp4" />
                                  <source src={post.videoVO.videoLink720p} type="video/mp4" />
                                  <source src={post.videoVO.videoLink480p} type="video/mp4" />
                                  Tarayıcı video oynatmayı desteklemiyor.
                                </video>
                                {post.videoVO.videoTimeSeconds > 0 && (
                                  <div className="text-xs text-neutral-400 p-2 bg-neutral-900/70">
                                    Süre: {Math.floor(post.videoVO.videoTimeSeconds / 60)}:
                                    {(post.videoVO.videoTimeSeconds % 60)
                                      .toString()
                                      .padStart(2, '0')}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-6 mt-4 text-neutral-400 text-sm">
                              <div className="flex items-center gap-1.5 hover:text-blue-400 transition">
                                <MessageSquare size={18} />
                                {post.commentCount || 0}
                              </div>
                              <div className="flex items-center gap-1.5 hover:text-green-400 transition">
                                <Repeat size={18} />
                                {post.quoteCount || 0}
                              </div>
                              <div className="flex items-center gap-1.5 hover:text-red-400 transition">
                                <Heart size={18} />
                                {post.likeCount || 0}
                              </div>
                              <div className="flex items-center gap-1.5 hover:text-sky-400 transition">
                                <Eye size={18} />
                                {post.viewCount?.toLocaleString() || 0}
                              </div>
                              <div className="flex items-center gap-1.5 hover:text-yellow-400 transition">
                                <Share2 size={18} />
                                {post.shareCount || 0}
                              </div>
                            </div>

                            {hasShareLinks && (
                              <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
                                {post.webLink && (
                                  <a
                                    href={post.webLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-neutral-300 transition flex items-center gap-1"
                                  >
                                    <LinkIcon size={14} /> Web'de aç
                                  </a>
                                )}
                                {post.shareLink && (
                                  <a
                                    href={post.shareLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-neutral-300 transition flex items-center gap-1"
                                  >
                                    <Share2 size={14} /> Paylaş
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-neutral-500">Henüz gönderi yok</div>
              )}
            </div>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
              <div className="border-b border-neutral-800 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {faqItems.map((item, index) => (
                  <details
                    key={item.question}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3"
                    open={index === 0}
                  >
                    <summary className="cursor-pointer list-none text-sm sm:text-base font-medium text-white">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm text-neutral-300 leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6">
              <HotList />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
