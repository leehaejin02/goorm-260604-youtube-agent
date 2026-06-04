import OpenAI from "openai";
import { searchVideos } from "./searchAgent";
import { getVideoStats } from "./videoStatsAgent";
import { TrendReport, VideoStats } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyzeTrends(topVideos: VideoStats[], keyword: string): Promise<string> {
  const videoSummaries = topVideos.slice(0, 20).map((v, i) => ({
    rank: i + 1,
    title: v.title,
    channel: v.channelTitle,
    viewCount: v.viewCount.toLocaleString(),
    trendingScore: v.trendingScore.toLocaleString(),
    label: v.trendingLabel,
    publishedAt: v.publishedAt.slice(0, 10),
  }));

  const prompt = `다음은 YouTube에서 "${keyword}" 키워드로 수집한 최근 급상승 영상 Top 20 데이터입니다.

${JSON.stringify(videoSummaries, null, 2)}

아래 형식으로 트렌드 분석 리포트를 작성해주세요:

1. **이번 주 급부상 토픽 3~5개** — 각 토픽에 대한 2~3줄 해설
2. **제목 패턴 인사이트** — 자주 등장하는 패턴 (숫자형, 의문형, 비교형 등), 추천 제목 공식 2~3개
3. **채널별 콘텐츠 아이디어** — NXP 블로그 / AI 뉴스 채널 / 쇼츠 각 3개씩

한국어로 작성해주세요.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "당신은 YouTube 콘텐츠 트렌드 분석 전문가입니다. 데이터 기반으로 실용적이고 즉시 활용 가능한 인사이트를 제공합니다.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? "";
}

export async function runOrchestrator(
  keyword: string,
  publishedAfterDays = 7
): Promise<TrendReport> {
  console.log(`\n🔍 검색 중: "${keyword}" (최근 ${publishedAfterDays}일)`);
  const searchResults = await searchVideos(keyword, 50, publishedAfterDays);
  console.log(`  ✅ 검색 결과: ${searchResults.length}개 영상 발견`);

  console.log("📊 영상 통계 수집 중...");
  const videoStats = await getVideoStats(searchResults);
  console.log(`  ✅ 통계 수집 완료: ${videoStats.length}개`);

  const topVideos = videoStats.slice(0, 10);

  console.log("🤖 OpenAI로 트렌드 분석 중...");
  const trendSummary = await analyzeTrends(videoStats, keyword);
  console.log("  ✅ 분석 완료");

  return {
    generatedAt: new Date().toISOString(),
    keyword,
    topVideos,
    trendSummary,
  };
}
