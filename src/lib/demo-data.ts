import { withSentiment, withTags } from "./classify";
import type { CompanyBundle, CompanyInfo } from "./types";

// 데모 기업은 모두 가상입니다. 실제 기업·수치와 무관합니다.
const eok = (n: number) => n * 1e8;

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

interface DemoSeed {
  info: CompanyInfo;
  fin: {
    revenue: number;
    op: number;
    net: number;
    assets: number;
    liab: number;
    ca: number;
    cl: number;
    interest: number;
  };
  disclosures: { title: string; ago: number }[];
  news: { title: string; source: string; ago: number }[];
}

const SEEDS: DemoSeed[] = [
  {
    info: {
      code: "DEMO001",
      name: "한빛전자 (가상)",
      stockCode: "000001",
      ceo: "김한빛",
      industry: "전자부품 제조",
      market: "유가증권시장",
      established: "1994-03-15",
      address: "경기도 성남시 분당구 (가상 주소)",
      homepage: "https://example.com",
    },
    fin: { revenue: eok(52000), op: eok(6200), net: eok(4800), assets: eok(61000), liab: eok(18000), ca: eok(30000), cl: eok(12000), interest: eok(300) },
    disclosures: [
      { title: "분기보고서 (2026.09)", ago: 8 },
      { title: "현금ㆍ현물배당 결정", ago: 20 },
      { title: "단일판매ㆍ공급계약 체결", ago: 33 },
    ],
    news: [
      { title: "한빛전자, 3분기 호실적…영업이익 개선", source: "데모뉴스", ago: 3 },
      { title: "한빛전자 신규 공장 수주 확대", source: "데모뉴스", ago: 9 },
      { title: "전자부품 업황 점진적 회복", source: "데모뉴스", ago: 14 },
    ],
  },
  {
    info: {
      code: "DEMO002",
      name: "누리모빌리티 (가상)",
      stockCode: "000002",
      ceo: "이누리",
      industry: "자동차 부품",
      market: "코스피",
      established: "2003-07-01",
      address: "충남 천안시 (가상 주소)",
      homepage: "https://example.com",
    },
    fin: { revenue: eok(15000), op: eok(900), net: eok(500), assets: eok(14000), liab: eok(8000), ca: eok(5200), cl: eok(3600), interest: eok(260) },
    disclosures: [
      { title: "분기보고서 (2026.09)", ago: 10 },
      { title: "전환사채권발행결정", ago: 25 },
      { title: "소송등의제기ㆍ신청", ago: 40 },
    ],
    news: [
      { title: "누리모빌리티, 완성차 납품 계약 체결", source: "데모뉴스", ago: 5 },
      { title: "원자재 가격 상승에 수익성 부담", source: "데모뉴스", ago: 11 },
      { title: "누리모빌리티 신제품 공개", source: "데모뉴스", ago: 18 },
    ],
  },
  {
    info: {
      code: "DEMO003",
      name: "새론바이오 (가상)",
      stockCode: "000003",
      ceo: "박새론",
      industry: "바이오·의약품",
      market: "코스닥",
      established: "2011-11-20",
      address: "인천 연수구 (가상 주소)",
      homepage: "https://example.com",
    },
    fin: { revenue: eok(1800), op: eok(-420), net: eok(-510), assets: eok(3200), liab: eok(1900), ca: eok(900), cl: eok(1100), interest: eok(60) },
    disclosures: [
      { title: "유상증자결정", ago: 6 },
      { title: "임상시험 중단 관련 조회공시 답변", ago: 15 },
      { title: "불성실공시법인 지정예고", ago: 30 },
    ],
    news: [
      { title: "새론바이오 적자 지속…유상증자 추진", source: "데모뉴스", ago: 4 },
      { title: "새론바이오 주가 급락", source: "데모뉴스", ago: 7 },
      { title: "새론바이오, 신약 후보물질 연구 계속", source: "데모뉴스", ago: 22 },
    ],
  },
  {
    info: {
      code: "DEMO004",
      name: "대성건설 (가상)",
      stockCode: "000004",
      ceo: "최대성",
      industry: "종합 건설",
      market: "코스피",
      established: "1978-05-09",
      address: "서울 영등포구 (가상 주소)",
      homepage: "https://example.com",
    },
    fin: { revenue: eok(9800), op: eok(-150), net: eok(-900), assets: eok(22000), liab: eok(19500), ca: eok(8000), cl: eok(11500), interest: eok(780) },
    disclosures: [
      { title: "채무보증결정", ago: 5 },
      { title: "감사의견 한정 관련 공시", ago: 12 },
      { title: "횡령ㆍ배임혐의발생", ago: 19 },
      { title: "기업회생절차 관련 조회공시 답변", ago: 28 },
    ],
    news: [
      { title: "대성건설 적자 확대…유동성 부담 커져", source: "데모뉴스", ago: 2 },
      { title: "대성건설, 압수수색 보도", source: "데모뉴스", ago: 6 },
      { title: "건설경기 부진 지속", source: "데모뉴스", ago: 13 },
    ],
  },
];

export function demoList(): CompanyInfo[] {
  return SEEDS.map((s) => s.info);
}

export function searchDemo(q: string): CompanyInfo[] {
  const key = q.trim().toLowerCase();
  if (!key) return demoList();
  return SEEDS.filter(
    (s) => s.info.name.toLowerCase().includes(key) || s.info.stockCode?.includes(key),
  ).map((s) => s.info);
}

export function getDemoBundle(code: string, notice?: string): CompanyBundle | null {
  const seed = SEEDS.find((s) => s.info.code === code);
  if (!seed) return null;
  return {
    info: seed.info,
    financials: {
      year: new Date().getFullYear() - 1,
      revenue: seed.fin.revenue,
      operatingIncome: seed.fin.op,
      netIncome: seed.fin.net,
      assets: seed.fin.assets,
      liabilities: seed.fin.liab,
      equity: seed.fin.assets - seed.fin.liab,
      currentAssets: seed.fin.ca,
      currentLiabilities: seed.fin.cl,
      interestExpense: seed.fin.interest,
    },
    disclosures: withTags(
      seed.disclosures.map((d, i) => ({
        id: `${code}-d${i}`,
        title: d.title,
        date: daysAgo(d.ago),
        filer: seed.info.name,
        url: "#",
      })),
    ),
    news: withSentiment(
      seed.news.map((n) => ({
        title: n.title,
        link: "#",
        source: n.source,
        date: daysAgo(n.ago),
      })),
    ),
    demo: true,
    notice: notice ?? "데모 데이터입니다. 가상의 기업이며 실제 수치가 아닙니다.",
  };
}
