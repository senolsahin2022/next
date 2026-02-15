export interface Post {
  id: string;
  user: User;
  content: string;
  timestamp: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  media?: Media[];
  hashtags?: string[];
  mentions?: string[];
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified?: boolean;
  followers?: number;
  following?: number;
}

export interface Media {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface HotListItem {
  rank: number;
  topic: string;
  posts: number;
  trend: 'up' | 'down' | 'stable';
}
