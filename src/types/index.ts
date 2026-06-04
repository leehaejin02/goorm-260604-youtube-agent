export interface SearchResult {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export interface VideoStats {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  thumbnailUrl: string;
  trendingScore: number;
  trendingLabel: "🔥 급상승" | "📈 상승세" | "일반";
}

export interface TrendReport {
  id: string;
  generatedAt: string;
  keyword: string;
  days: number;
  topVideos: VideoStats[];
  trendSummary: string;
}

export interface TrendingVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  thumbnailUrl: string;
}

export interface GlobalInsights {
  updatedAt: string;
  globalTrending: TrendingVideo[];
  koreanTrending: TrendingVideo[];
}

export interface UserInfo {
  email: string;
  name: string;
  picture: string;
  isAdmin: boolean;
}
