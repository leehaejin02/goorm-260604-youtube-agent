import { google } from "googleapis";
import { SearchResult } from "../types";

const youtube = google.youtube("v3");

export async function searchVideos(
  keyword: string,
  maxResults = 50,
  publishedAfterDays = 7
): Promise<SearchResult[]> {
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - publishedAfterDays);

  const response = await youtube.search.list({
    key: process.env.YOUTUBE_API_KEY,
    q: keyword,
    type: ["video"],
    order: "viewCount",
    publishedAfter: publishedAfter.toISOString(),
    regionCode: "KR",
    relevanceLanguage: "ko",
    maxResults,
    part: ["snippet"],
  });

  const items = response.data.items ?? [];

  return items
    .filter((item) => item.id?.videoId && item.snippet)
    .map((item) => ({
      videoId: item.id!.videoId!,
      title: item.snippet!.title ?? "",
      channelId: item.snippet!.channelId ?? "",
      channelTitle: item.snippet!.channelTitle ?? "",
      publishedAt: item.snippet!.publishedAt ?? "",
      thumbnailUrl: item.snippet!.thumbnails?.high?.url ?? "",
    }));
}
