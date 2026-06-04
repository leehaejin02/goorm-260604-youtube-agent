import { google } from "googleapis";
import { SearchResult, VideoStats } from "../types";

const youtube = google.youtube("v3");

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0");
  const minutes = parseInt(match[2] ?? "0");
  const seconds = parseInt(match[3] ?? "0");
  return hours * 3600 + minutes * 60 + seconds;
}

function calcTrendingScore(viewCount: number, publishedAt: string): number {
  const hoursElapsed =
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  return viewCount / Math.max(1, hoursElapsed);
}

function getTrendingLabel(
  score: number,
  publishedAt: string
): VideoStats["trendingLabel"] {
  const hoursElapsed =
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  if (hoursElapsed <= 24 && score > 10000) return "🔥 급상승";
  if (hoursElapsed <= 168 && score > 3000) return "📈 상승세";
  return "일반";
}

// videos.list는 한 번에 최대 50개 — 유닛 절약을 위해 묶음 호출
export async function getVideoStats(
  searchResults: SearchResult[]
): Promise<VideoStats[]> {
  const videoIds = searchResults.map((r) => r.videoId);
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const allStats: VideoStats[] = [];

  for (const chunk of chunks) {
    const response = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      id: chunk,
      part: ["statistics", "snippet", "contentDetails"],
    });

    const items = response.data.items ?? [];
    for (const item of items) {
      const stats = item.statistics ?? {};
      const snippet = item.snippet ?? {};
      const viewCount = parseInt(stats.viewCount ?? "0");
      const publishedAt = snippet.publishedAt ?? "";
      const score = calcTrendingScore(viewCount, publishedAt);

      allStats.push({
        videoId: item.id ?? "",
        title: snippet.title ?? "",
        channelTitle: snippet.channelTitle ?? "",
        publishedAt,
        viewCount,
        likeCount: parseInt(stats.likeCount ?? "0"),
        commentCount: parseInt(stats.commentCount ?? "0"),
        duration: parseDuration(
          item.contentDetails?.duration ?? "PT0S"
        ).toString(),
        thumbnailUrl: snippet.thumbnails?.high?.url ?? "",
        trendingScore: Math.round(score),
        trendingLabel: getTrendingLabel(score, publishedAt),
      });
    }
  }

  return allStats.sort((a, b) => b.trendingScore - a.trendingScore);
}
