'use client';

import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  BadgeCheck,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  AlertTriangle,
  Play,
  Volume2,
  ChartLine,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: any; // Çünkü JSON çok büyük ve dinamik
}

const extractHashtagsFromContent = (text: string) => {
  if (!text) return [];
  const matches = text.match(/#(\w+)/g);
  return matches ? matches.map((t) => t.replace('#', '')) : [];
};

const renderReactionBreakdown = (reactions: any[]) => {
  return reactions
    .filter((r) => r.count > 0)
    .map((r) => `${r.count} ${getReactionEmoji(r.reactionType)}`)
    .join(' · ');
};

const getReactionEmoji = (type: number) => {
  switch (type) {
    case 1: return '👍';
    case 2: return '❤️';
    case 3: return '😂';
    case 4: return '😮';
    case 5: return '😢';
    default: return '⭐';
  }
};

const renderUserLabels = (labels: any[]) => {
  if (!labels || labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {labels.map((label, i) => (
        <span key={i} className="text-xs text-neutral-400 flex items-center gap-1">
          {label.icon && <img src={label.icon} alt="" className="w-3 h-3" />}
          {label.name}
        </span>
      ))}
    </div>
  );
};

const renderBadgeInfos = (badges: any[]) => {
  if (!badges || badges.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1">
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-1 text-xs bg-yellow-900 text-yellow-400 px-2 py-1 rounded">
          <Award className="w-3 h-3" />
          {badge.badgeName}
        </div>
      ))}
    </div>
  );
};

const renderUserTag = (userTag: any) => {
  if (!userTag) return null;
  return (
    <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
      <Users className="w-3 h-3" />
      {userTag.name}
    </div>
  );
};

const renderFuturesTrading = (futuresTrading: any) => {
  if (!futuresTrading) return null;
  const isPositive = parseFloat(futuresTrading.returnRate || '0') > 0;
  const pnlColor = isPositive ? 'text-green-400' : 'text-red-400';
  const trendIcon = isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;

  return (
    <div className="mt-3 p-3 bg-neutral-900 rounded-xl border-l-4 border-green-500">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-neutral-300">Futures Position: {futuresTrading.positionSide} {futuresTrading.contractType}</span>
        {trendIcon}
      </div>
      <div className="space-y-1 text-xs text-neutral-400">
        <div>Symbol: {futuresTrading.symbol} ({futuresTrading.baseAsset}/{futuresTrading.quoteAsset})</div>
        <div className={pnlColor}>Return: {futuresTrading.returnRate}% | PNL: {futuresTrading.pnl || '0'}</div>
        <div>Entry: ${futuresTrading.entryPrice} | Mark: ${futuresTrading.markPrice} | Close: ${futuresTrading.closePrice}</div>
        <div>Amount: {futuresTrading.positionAmount} {futuresTrading.baseAsset} | Created: {new Date(futuresTrading.positionCreateTime).toLocaleString()}</div>
        {futuresTrading.leverage && <div>Leverage: {futuresTrading.leverage}x</div>}
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          Initial Margin: {futuresTrading.initialMargin || 'N/A'}
        </div>
      </div>
      {futuresTrading.klines && futuresTrading.klines.length > 0 && (
        <div className="mt-2 p-2 bg-neutral-800 rounded text-xs text-neutral-500 overflow-x-auto">
          <ChartLine className="w-4 h-4 inline mr-1" />
          Recent Klines: {futuresTrading.klines.slice(-5).map((k: any) => (
            <span key={k.time} className={`ml-1 px-1 py-0.5 rounded ${k.buy ? 'bg-green-600' : k.sell ? 'bg-red-600' : 'bg-gray-600'}`}>
              ${k.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const renderTradingPairsV2 = (pairs: any[]) => {
  if (!pairs || pairs.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {pairs.map((pair, i) => {
        const change = parseFloat(pair.priceChange || '0');
        const changeColor = change >= 0 ? 'text-green-400' : 'text-red-400';
        const trendIcon = change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
        return (
          <div key={i} className="text-xs bg-blue-900 text-blue-400 px-3 py-1 rounded flex items-center gap-1">
            {pair.logoUrl && <img src={pair.logoUrl} alt={pair.code} className="w-4 h-4 rounded" />}
            <span>{pair.symbol} ${pair.price}</span>
            <span className={changeColor}>{trendIcon} {pair.priceChange}%</span>
          </div>
        );
      })}
    </div>
  );
};

const renderLiquidationAlert = (content: string) => {
  if (!content.toLowerCase().includes('liquidated') && !content.includes('LIQUIDATION')) return null;
  return (
    <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded text-red-400 text-xs">
      <AlertTriangle className="w-4 h-4 inline mr-1" />
      Liquidation Detected: {content.includes('$250 MILLION') ? '🚨 $250M Liquidation Alert' : 'Potential Liquidation Risk'}
    </div>
  );
};

const renderMedia = (post: any) => {
  const images = post.images?.length > 0 ? post.images : post.imageMetaList?.map((i: any) => i.url) || [];
  const videos = post.videos || []; // Assuming videos array exists if present
  const audios = post.audios || []; // Assuming audios array exists if present

  const allMedia = [...images.map((img: string) => ({ type: 'image', url: img })), 
                    ...videos.map((vid: string) => ({ type: 'video', url: vid })), 
                    ...audios.map((aud: string) => ({ type: 'audio', url: aud }))];

  if (allMedia.length === 0) return null;

  return (
    <div className={`mt-3 grid gap-2 ${allMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {allMedia.slice(0, 4).map((media, idx) => (
        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
          {media.type === 'image' && (
            <Image src={media.url} alt="Media" fill className="object-cover" />
          )}
          {media.type === 'video' && (
            <video src={media.url} controls className="w-full h-full object-cover">
              Your browser does not support the video tag.
            </video>
          )}
          {media.type === 'audio' && (
            <div className="flex flex-col items-center justify-center h-full">
              <Volume2 className="w-12 h-12 text-neutral-500 mb-2" />
              <audio controls className="w-full">
                <source src={media.url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <span className="text-xs text-neutral-500 mt-1">Audio Attachment</span>
            </div>
          )}
        </div>
      ))}
      {allMedia.length > 4 && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-800 flex items-center justify-center col-span-2">
          <span className="text-neutral-500">+{allMedia.length - 4} more media</span>
        </div>
      )}
    </div>
  );
};

const renderPortfolioPerformance = (performance: any) => {
  if (!performance) return null;
  return (
    <div className="mt-3 p-3 bg-indigo-900 rounded-xl text-xs text-indigo-300">
      <strong>Portfolio Performance:</strong> Total Return: {performance.totalReturn || 'N/A'}% | 
      Assets: {performance.assets?.length || 0} | Hold Days: {performance.holdDays || 'N/A'}
    </div>
  );
};

const renderTradingSignal = (signal: any) => {
  if (!signal) return null;
  return (
    <div className="mt-3 p-3 bg-purple-900 rounded-xl text-xs text-purple-300">
      <strong>Trading Signal:</strong> {signal.content || signal.signalType || 'Active Signal'} | 
      Target: {signal.targetPrice || 'N/A'} | Stop Loss: {signal.stopLoss || 'N/A'}
    </div>
  );
};

export function PostCard({ post }: PostCardProps) {
  const profileId = post.squareAuthorId || post.username || post.authorName || 'unknown';
  const displayName = post.authorName || post.displayName || post.username || 'Unknown';
  const avatarUrl = post.authorAvatar || post.avatar || '/placeholder.svg';


  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTimeAgo = () => {
    if (post.date) {
      const ts = typeof post.date === 'number' && post.date > 10_000_000_000
        ? post.date
        : post.date * 1000;
      return formatDistanceToNow(new Date(ts), { addSuffix: true });
    }
    return 'Recently';
  };

  const hashtags =
    post.hashtagList?.length > 0
      ? post.hashtagList.map((h: string) => h.replace('#', ''))
      : extractHashtagsFromContent(post.content || '');

  const isLiked = post.isLiked || false;
  const isFollowed = post.isFollowed || false;
  const followsYou = post.followsYou || false;

  return (
    <article className="bg-black border-b border-neutral-800 p-5 hover:bg-neutral-950 transition-colors">
      <div className="flex gap-3">

        {/* USER AVATAR */}
        <Link href={`/user/${encodeURIComponent(profileId)}`} className="flex-shrink-0">
          <div className="relative w-12 h-12">
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="rounded-full object-cover"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0">

          {/* HEADER */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/user/${encodeURIComponent(profileId)}`}
              className="font-semibold text-white hover:text-green-400 transition-colors"
            >
              {displayName}
            </Link>
            {followsYou && <span className="text-green-400 text-xs">• Follows You</span>}
            {isFollowed && <span className="text-blue-400 text-xs">• Following</span>}

            {post.authorVerificationType === 1 && (
              <BadgeCheck className="w-4 h-4 text-green-400" />
            )}

            {post.authorRole === 1 && (
              <span className="text-xs text-yellow-400">Official</span>
            )}

            <span className="text-sm text-neutral-500">·</span>
            <span className="text-sm text-neutral-500">{getTimeAgo()}</span>
          </div>

          {/* USER LABELS */}
          {renderUserLabels(post.userLabels)}

          {/* TITLE */}
          {post.title && (
            <h2 className="text-lg font-bold text-white mt-2">
              {post.title}
            </h2>
          )}

          {/* SUBTITLE */}
          {post.subTitle && (
            <p className="text-sm text-neutral-400 mt-1">
              {post.subTitle}
            </p>
          )}

          {/* CONTENT */}
          {post.content && (
            <Link href={`/post/${post.id}`} className="block mt-2">
              <p className="text-white whitespace-pre-wrap break-words">
                {post.content}
              </p>
            </Link>
          )}

          {/* LIQUIDATION ALERT */}
          {renderLiquidationAlert(post.content || '')}

          {/* HASHTAGS */}
          {hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {hashtags.map((tag: string, i: number) => (
                <Link
                  key={i}
                  href={`/hashtag/${encodeURIComponent(tag)}`}
                  className="text-sm text-green-400 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* COIN PAIRS & TRADING PAIRS V2 */}
          {(post.coinPairList?.length > 0 ||
            post.tradingPairs?.length > 0 ||
            post.tradingPairsV2?.length > 0 ||
            post.userInputTradingPairs?.length > 0) && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {post.coinPairList?.map((c: string, i: number) => (
                <span
                  key={i}
                  className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded"
                >
                  {c.trim()}
                </span>
              ))}

              {post.tradingPairs?.map((tp: any, i: number) => (
                <span
                  key={i}
                  className="text-xs bg-blue-900 text-blue-400 px-2 py-1 rounded"
                >
                  {tp.symbol || tp.code}
                </span>
              ))}

              {renderTradingPairsV2(post.tradingPairsV2 || post.userInputTradingPairs)}
            </div>
          )}

          {/* USER TAG */}
          {renderUserTag(post.userTag)}

          {/* BADGE INFOS */}
          {renderBadgeInfos(post.badgeInfos)}

          {/* MEDIA (Images, Videos, Audios) */}
          {renderMedia(post)}

          {/* SHARE TRADING & FUTURES */}
          {post.shareTrading && (
            <div className="mt-3 p-3 bg-neutral-900 rounded-xl text-xs text-neutral-300">
              <div>Daily PNL: {post.shareTrading.dailyPNL ?? '-'}</div>
              <div>30D PNL: {post.shareTrading.thirtyDayPNL ?? '-'}</div>
              {post.shareTrading.assetDistribution && <div>Assets: {JSON.stringify(post.shareTrading.assetDistribution)}</div>}
              {post.shareTrading.tradePNL && <div>Trade PNL: {post.shareTrading.tradePNL}</div>}
              {renderFuturesTrading(post.shareTrading.futuresTrading)}
              {post.shareTrading.spotTrading && <div className="mt-2 text-xs">Spot Trading: {JSON.stringify(post.shareTrading.spotTrading)}</div>}
            </div>
          )}

          {/* TRADING SIGNAL */}
          {renderTradingSignal(post.tradingSignal)}

          {/* PORTFOLIO PERFORMANCE */}
          {renderPortfolioPerformance(post.portfolioPerformance)}

          {/* RED ENVELOPE */}
          {post.redEnvelop && (
            <div className="mt-3 p-3 bg-orange-900 rounded-xl text-xs text-orange-300">
              <strong>Red Envelope:</strong> {post.redEnvelop.amount || 'Available'} {post.redEnvelop.currency || 'USDT'}
              {post.isAssociateRedEnvelop && <span className="ml-2">• Associated</span>}
            </div>
          )}

          {/* HYPERLINKS */}
          {post.hyperlinkList && post.hyperlinkList.length > 0 && (
            <div className="mt-2 space-y-1">
              {post.hyperlinkList.map((link: any, i: number) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                  🔗 {link.title || link.url}
                </a>
              ))}
            </div>
          )}

          {/* MENTIONS */}
          {post.mentionUserVOs && post.mentionUserVOs.length > 0 && (
            <div className="mt-2 text-xs text-neutral-400">
              Mentions: {post.mentionUserVOs.map((u: any) => u.username).join(', ')}
            </div>
          )}

          {/* QUOTE CONTENT */}
          {post.quoteContent && (
            <div className="mt-3 p-2 bg-gray-900 rounded text-xs text-neutral-300 border-l-4 border-purple-500">
              <strong>Quoted:</strong> {post.quoteContent.content || 'Quoted post'}
            </div>
          )}

          {/* STATS */}
          <div className="mt-4 flex items-center gap-6 text-neutral-500">

            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm">{formatNumber(post.likeCount)}</span>
            </div>

            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{formatNumber(post.commentCount || post.replyCount)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{formatNumber(post.shareCount)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{formatNumber(post.viewCount)}</span>
            </div>

            {post.quoteCount > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm">💬 {formatNumber(post.quoteCount)}</span>
              </div>
            )}
          </div>

          {/* REACTIONS BREAKDOWN */}
          {post.reactionCount && post.reactionCount.length > 0 && (
            <div className="mt-2 text-xs text-neutral-400 flex items-center gap-2">
              Reactions: {renderReactionBreakdown(post.reactionCount)}
            </div>
          )}

          {post.totalReactionCount > 0 && !post.reactionCount && (
            <div className="mt-2 text-xs text-neutral-400">
              Total Reactions: {post.totalReactionCount}
            </div>
          )}

          {/* HOT COMMENTS */}
          {post.hotComments && post.hotComments.length > 0 && (
            <div className="mt-2 text-xs text-neutral-500 italic">
              🔥 Hot Comment: "{post.hotComments[0]?.comment || post.hotComments[0]?.content || post.hotComments[0]?.translatedComment || ''}"
            </div>
          )}

          {post.hotComment && (
            <div className="mt-2 text-xs text-neutral-500 italic">
              🔥 Hot: "{post.hotComment?.comment || post.hotComment?.content || post.hotComment?.translatedComment || (typeof post.hotComment === 'string' ? post.hotComment : '')}"
            </div>
          )}

          {/* AI SUMMARY */}
          {post.aiSummary && (
            <div className="mt-2 p-2 bg-blue-900/30 rounded text-xs text-blue-300 border">
              🤖 AI Summary: {post.aiSummary}
            </div>
          )}

          {/* ADDITIONAL FLAGS */}
          {(post.isStickyToTop || post.isFeatured || post.topFlagInHashtagDetailPage) && (
            <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
              {post.isStickyToTop && '📌 Sticky'}
              {post.isFeatured && '⭐ Featured'}
              {post.topFlagInHashtagDetailPage && '🏷️ Top in Hashtag'}
            </div>
          )}

          {post.isCreatedByAI && (
            <div className="mt-1 text-xs text-purple-400">🤖 AI-Generated Content</div>
          )}

          {post.isReplyPost && post.replyUserCount > 0 && (
            <div className="mt-1 text-xs text-neutral-400">Reply to {post.replyUserCount} users</div>
          )}
        </div>
      </div>
    </article>
  );
}
