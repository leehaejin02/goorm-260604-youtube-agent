import "dotenv/config";
import { runOrchestrator } from "./agents/orchestrator";
import { saveReport, buildMarkdownReport } from "./reporter";

async function main() {
  const keyword = process.argv[2];

  if (!keyword) {
    console.error("사용법: npx ts-node src/index.ts <키워드>");
    console.error("예시:  npx ts-node src/index.ts AI");
    process.exit(1);
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.");
    process.exit(1);
  }

  try {
    const report = await runOrchestrator(keyword);
    const filepath = saveReport(report);

    console.log("\n" + "=".repeat(60));
    console.log(buildMarkdownReport(report));
    console.log("=".repeat(60));
    console.log(`\n💾 리포트 저장됨: ${filepath}`);
  } catch (err) {
    console.error("❌ 오류 발생:", err);
    process.exit(1);
  }
}

main();
