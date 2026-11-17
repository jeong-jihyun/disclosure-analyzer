import type { Disclosure, NewsItem, RiskTag, Sentiment } from "./types";

// 공시 제목에서 위험 신호를 찾는 규칙 (키워드 → 이름표와 강도)
const DISCLOSURE_RULES: { keywords: string[]; label: string; severity: 1 | 2 | 3 }[] = [
  { keywords: ["횡령", "배임"], label: "횡령·배임", severity: 3 },
  { keywords: ["상장폐지", "관리종목", "거래정지", "매매거래정지"], label: "상장 위험", severity: 3 },
  { keywords: ["감사의견", "의견거절", "한정", "부적정"], label: "감사의견", severity: 3 },
  { keywords: ["회생", "파산", "부도", "채무불이행"], label: "도산 위험", severity: 3 },
  { keywords: ["불성실공시"], label: "불성실공시", severity: 2 },
  { keywords: ["유상증자"], label: "유상증자", severity: 2 },
  { keywords: ["감자"], label: "감자", severity: 2 },
  { keywords: ["전환사채", "신주인수권부사채", "교환사채"], label: "메자닌 발행", severity: 2 },
  { keywords: ["소송", "피소"], label: "소송", severity: 2 },
  { keywords: ["최대주주 변경", "최대주주변경", "경영권"], label: "최대주주·경영권", severity: 2 },
  { keywords: ["대규모 손실", "손상차손", "영업정지"], label: "손실·영업정지", severity: 2 },
  { keywords: ["담보제공", "채무보증", "타인에 대한 채무"], label: "담보·보증", severity: 1 },
  { keywords: ["자기주식 처분", "임원ㆍ주요주주", "정정"], label: "참고", severity: 1 },
];

// 좋은 신호 (뉴스·공시 모두 참고)
const POSITIVE_WORDS = ["흑자", "사상 최대", "최대 실적", "수주", "호실적", "성장", "개선", "회복", "배당", "자사주 매입", "계약 체결", "신고가"];
const NEGATIVE_WORDS = ["적자", "급락", "하락", "손실", "소송", "횡령", "배임", "부진", "악화", "리콜", "상장폐지", "감자", "유상증자", "압수수색", "구속", "파산", "회생", "제재", "과징금", "부담", "우려"];

export function tagDisclosure(title: string): RiskTag[] {
  const tags: RiskTag[] = [];
  for (const rule of DISCLOSURE_RULES) {
    if (rule.keywords.some((k) => title.includes(k))) {
      if (!tags.some((t) => t.label === rule.label)) {
        tags.push({ label: rule.label, severity: rule.severity });
      }
    }
  }
  return tags;
}

export function classifyNews(title: string): Sentiment {
  const neg = NEGATIVE_WORDS.filter((w) => title.includes(w)).length;
  const pos = POSITIVE_WORDS.filter((w) => title.includes(w)).length;
  if (neg > pos) return "neg";
  if (pos > neg) return "pos";
  return "neu";
}

export function withTags(list: Omit<Disclosure, "tags">[]): Disclosure[] {
  return list.map((d) => ({ ...d, tags: tagDisclosure(d.title) }));
}

export function withSentiment(list: Omit<NewsItem, "sentiment">[]): NewsItem[] {
  return list.map((n) => ({ ...n, sentiment: classifyNews(n.title) }));
}
