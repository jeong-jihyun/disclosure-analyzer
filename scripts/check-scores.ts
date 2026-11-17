// 데모 기업 4곳의 점수와 시뮬레이션 결과를 확인하는 점검 스크립트
import { getDemoBundle } from "../src/lib/demo-data";
import { applyShock, computeScore } from "../src/lib/score";

for (const code of ["DEMO001", "DEMO002", "DEMO003", "DEMO004"]) {
  const b = getDemoBundle(code)!;
  const s = computeScore(b.financials, b.disclosures, b.news)!;
  const shocked = computeScore(
    applyShock(b.financials!, { revenueChange: -0.25, debtChange: 0.3, rateUp: 0.02 }),
    b.disclosures,
    b.news,
  )!;
  console.log(
    b.info.name.padEnd(16),
    `점수 ${s.total} ${s.grade}`,
    JSON.stringify(s.parts),
    `부채비율 ${s.metrics.debtRatio.toFixed(0)}% 유동 ${s.metrics.currentRatio.toFixed(0)}% 영업이익률 ${s.metrics.opMargin.toFixed(1)}% 이자보상 ${s.metrics.interestCover.toFixed(1)}`,
    `| 충격 후 ${shocked.total} ${shocked.grade}`,
    "| 뉴스",
    b.news.map((n) => n.sentiment).join(","),
  );
}
