import { google } from "googleapis";
import { GlobalInsights, TrendingVideo } from "../types";

const youtube = google.youtube("v3");

async function fetchTrending(regionCode?: string): Promise<TrendingVideo[]> {
  const response = await youtube.videos.list({
    key: process.env.YOUTUBE_API_KEY,
    part: ["snippet", "statistics"],
    chart: "mostPopular",
    maxResults: 8,
    ...(regionCode ? { regionCode } : {}),
  });

  return (response.data.items ?? []).map((item) => ({
    videoId: item.id ?? "",
    title: item.snippet?.title ?? "",
    channelTitle: item.snippet?.channelTitle ?? "",
    viewCount: parseInt(item.statistics?.viewCount ?? "0"),
    thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? "",
  }));
}

export async function getGlobalInsights(): Promise<GlobalInsights> {
  const [globalTrending, koreanTrending] = await Promise.all([
    fetchTrending(),
    fetchTrending("KR"),
  ]);
  return { updatedAt: new Date().toISOString(), globalTrending, koreanTrending };
}
