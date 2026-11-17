// 공시 분석 사이트에서 쓰는 데이터 모양(타입) 모음

export type Grade = "안정" | "보통" | "주의" | "위험";

export interface CompanyInfo {
  /** 사이트 안에서 쓰는 식별자 (DART 고유번호 8자리 또는 데모 id) */
  code: string;
  name: string;
  stockCode?: string;
  ceo?: string;
  industry?: string;
  market?: string;
  established?: string;
  address?: string;
  homepage?: string;
}

/** 모든 금액은 원 단위 */
export interface Financials {
  year: number;
  revenue: number;
  operatingIncome: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  currentAssets: number;
  currentLiabilities: number;
  interestExpense: number;
}

export interface RiskTag {
  label: string;
  /** 1 참고, 2 주의, 3 심각 */
  severity: 1 | 2 | 3;
}

export interface Disclosure {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  filer: string;
  url: string;
  tags: RiskTag[];
}

export type Sentiment = "pos" | "neg" | "neu";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  date: string; // YYYY-MM-DD
  sentiment: Sentiment;
}

export interface Metrics {
  debtRatio: number; // 부채비율 %
  currentRatio: number; // 유동비율 %
  opMargin: number; // 영업이익률 %
  interestCover: number; // 이자보상배율 배 (이자비용 0이면 99)
}

export interface ScoreParts {
  stability: number; // 0~40
  profit: number; // 0~25
  disclosure: number; // 0~20
  news: number; // 0~15
}

export interface ScoreResult {
  total: number; // 0~100
  grade: Grade;
  parts: ScoreParts;
  metrics: Metrics;
}

export interface Shareholder {
  name: string;
  relation: string;
  shares: number;
  ratio: number; // 지분율 %
}

export interface DividendRow {
  item: string;
  current: string;
  prev: string;
  prev2: string;
}

export interface Officer {
  name: string;
  position: string;
  registered: string; // 등기임원 여부
  duty?: string;
}

export interface CompanyBundle {
  info: CompanyInfo;
  financials: Financials | null;
  /** 최근 3개년 (오래된 해 → 최신 해) */
  history: Financials[];
  shareholders: Shareholder[];
  dividends: DividendRow[];
  officers: Officer[];
  disclosures: Disclosure[];
  news: NewsItem[];
  /** true면 실제 데이터가 아니라 데모 데이터 */
  demo: boolean;
  /** 화면에 보여 줄 안내 문구 (키 없음, 호출 실패 등) */
  notice?: string;
}

export interface Shock {
  revenueChange: number; // -0.5 ~ +0.2 (비율)
  debtChange: number; // 0 ~ +1 (비율)
  rateUp: number; // 0 ~ 0.05 (금리 상승, 소수)
}
