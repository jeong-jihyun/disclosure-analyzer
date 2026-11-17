import type {
  Disclosure,
  Financials,
  Grade,
  Metrics,
  NewsItem,
  ScoreResult,
  Shock,
} from "./types";

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** 재무제표 → 핵심 지표 (8단계) */
export function computeMetrics(f: Financials): Metrics {
  const debtRatio = f.equity > 0 ? (f.liabilities / f.equity) * 100 : 999;
  const currentRatio =
    f.currentLiabilities > 0 ? (f.currentAssets / f.currentLiabilities) * 100 : 999;
  const opMargin = f.revenue > 0 ? (f.operatingIncome / f.revenue) * 100 : 0;
  const interestCover =
    f.interestExpense > 0
      ? f.operatingIncome / f.interestExpense
      : f.operatingIncome > 0
        ? 99
        : 0;
  return { debtRatio, currentRatio, opMargin, interestCover };
}

export function gradeOf(total: number): Grade {
  if (total >= 80) return "안정";
  if (total >= 60) return "보통";
  if (total >= 40) return "주의";
  return "위험";
}

/** 공시 위험 신호 점수 (0~20, 높을수록 안전) */
export function disclosureScore(list: Disclosure[]): number {
  const weight = { 1: 1, 2: 3, 3: 6 } as const;
  let penalty = 0;
  for (const d of list) for (const t of d.tags) penalty += weight[t.severity];
  return clamp(20 - penalty, 0, 20);
}

/** 뉴스 분위기 점수 (0~15). 뉴스가 없으면 중립보다 약간 낮게 */
export function newsScore(list: NewsItem[]): number {
  if (list.length === 0) return 9;
  const pos = list.filter((n) => n.sentiment === "pos").length;
  const neg = list.filter((n) => n.sentiment === "neg").length;
  const ratio = (pos - neg) / list.length; // -1 ~ 1
  return 15 * (0.5 + 0.5 * ratio);
}

/** 종합 점수 (11단계). 재무가 없으면 null */
export function computeScore(
  fin: Financials | null,
  disclosures: Disclosure[],
  news: NewsItem[],
): ScoreResult | null {
  if (!fin) return null;
  const m = computeMetrics(fin);
  const stability =
    25 * clamp((400 - m.debtRatio) / 300) + 15 * clamp((m.currentRatio - 50) / 150);
  const profit =
    15 * clamp((m.opMargin + 10) / 20) + 10 * clamp(m.interestCover / 5);
  const disc = disclosureScore(disclosures);
  const nw = newsScore(news);
  const total = Math.round(stability + profit + disc + nw);
  return {
    total,
    grade: gradeOf(total),
    parts: {
      stability: round1(stability),
      profit: round1(profit),
      disclosure: round1(disc),
      news: round1(nw),
    },
    metrics: m,
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * 충격 시나리오 적용 (12단계)
 * 가정: 매출이 줄면 이익은 감소분의 40%만큼 줄어든다(고정비 때문에 영향이 큼),
 *       늘어난 부채는 유동부채와 이자비용에도 비례해 반영, 이자 부담 부채는 총부채의 50%로 가정.
 */
export function applyShock(f: Financials, s: Shock): Financials {
  const revenue = f.revenue * (1 + s.revenueChange);
  const deltaRevenue = revenue - f.revenue;
  const operatingIncome = f.operatingIncome + deltaRevenue * 0.4;
  const liabilities = f.liabilities * (1 + s.debtChange);
  const currentLiabilities = f.currentLiabilities * (1 + s.debtChange);
  const interestExpense =
    f.interestExpense * (1 + s.debtChange) + liabilities * 0.5 * s.rateUp;
  const netIncome = f.netIncome + (operatingIncome - f.operatingIncome) - (interestExpense - f.interestExpense);
  return {
    ...f,
    revenue,
    operatingIncome,
    netIncome,
    liabilities,
    currentLiabilities,
    interestExpense,
    assets: f.assets + (liabilities - f.liabilities),
  };
}

export const GRADE_STYLE: Record<Grade, { text: string; bg: string; ring: string; hex: string }> = {
  안정: { text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", hex: "#10b981" },
  보통: { text: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-200", hex: "#0ea5e9" },
  주의: { text: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-200", hex: "#f59e0b" },
  위험: { text: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-200", hex: "#e11d48" },
};

/** 원 → 억원 표시 */
export function toEok(won: number): string {
  const eok = won / 1e8;
  if (Math.abs(eok) >= 10000) return `${(eok / 10000).toFixed(1)}조`;
  return `${Math.round(eok).toLocaleString("ko-KR")}억`;
}
