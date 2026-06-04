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
  trendingScore: number; // viewCount / hours_since_published
  trendingLabel: "🔥 급상승" | "📈 상승세" | "일반";
}

export interface TrendReport {
  generatedAt: string;
  keyword: string;
  topVideos: VideoStats[];
  trendSummary: string;
}
