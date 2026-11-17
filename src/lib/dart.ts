import { unzipSync, strFromU8 } from "fflate";
import { withTags } from "./classify";
import type { CompanyInfo, Disclosure, Financials } from "./types";

const BASE = "https://opendart.fss.or.kr/api";

export function dartKey(): string | null {
  const k = process.env.DART_API_KEY?.trim();
  return k ? k : null;
}

// ── 고유번호 목록 (회사명 검색용). 서버 메모리에 보관 ─────────────────
interface CorpRow {
  code: string;
  name: string;
  stock: string;
}
let corpCache: { rows: CorpRow[]; at: number } | null = null;

async function loadCorps(key: string): Promise<CorpRow[]> {
  if (corpCache && Date.now() - corpCache.at < 24 * 3600 * 1000) return corpCache.rows;
  const res = await fetch(`${BASE}/corpCode.xml?crtfc_key=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`corpCode ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(buf);
  const xmlName = Object.keys(files).find((n) => n.toLowerCase().endsWith(".xml"));
  if (!xmlName) throw new Error("corpCode 압축 안에 XML이 없습니다");
  const xml = strFromU8(files[xmlName]);
  const rows: CorpRow[] = [];
  const re =
    /<list>\s*<corp_code>(\d+)<\/corp_code>\s*<corp_name>([^<]*)<\/corp_name>\s*<stock_code>\s*([^<]*?)\s*<\/stock_code>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (m[3]) rows.push({ code: m[1], name: m[2], stock: m[3] }); // 상장사만
  }
  corpCache = { rows, at: Date.now() };
  return rows;
}

export async function searchCorps(q: string, key: string): Promise<CompanyInfo[]> {
  const rows = await loadCorps(key);
  const k = q.trim().toLowerCase();
  if (!k) return [];
  const hit = rows.filter((r) => r.name.toLowerCase().includes(k) || r.stock.includes(k));
  // 이름이 정확히 같거나 앞에서 시작하는 것을 먼저
  hit.sort((a, b) => rank(a.name, k) - rank(b.name, k) || a.name.length - b.name.length);
  return hit.slice(0, 20).map((r) => ({ code: r.code, name: r.name, stockCode: r.stock }));
}

const rank = (name: string, k: string) =>
  name.toLowerCase() === k ? 0 : name.toLowerCase().startsWith(k) ? 1 : 2;

// ── 기업개황 (7단계) ────────────────────────────────────────────────
const MARKET: Record<string, string> = { Y: "유가증권시장", K: "코스닥", N: "코넥스", E: "기타" };

export async function fetchCompany(code: string, key: string): Promise<CompanyInfo> {
  const res = await fetch(`${BASE}/company.json?crtfc_key=${key}&corp_code=${code}`, {
    next: { revalidate: 3600 },
  });
  const j = await res.json();
  if (j.status !== "000") throw new Error(`company: ${j.status} ${j.message ?? ""}`);
  const est = String(j.est_dt ?? "");
  return {
    code,
    name: j.corp_name,
    stockCode: j.stock_code || undefined,
    ceo: j.ceo_nm,
    industry: j.induty_code ? `업종코드 ${j.induty_code}` : undefined,
    market: MARKET[j.corp_cls] ?? j.corp_cls,
    established: est.length === 8 ? `${est.slice(0, 4)}-${est.slice(4, 6)}-${est.slice(6)}` : est,
    address: j.adres,
    homepage: j.hm_url ? (String(j.hm_url).startsWith("http") ? j.hm_url : `https://${j.hm_url}`) : undefined,
  };
}

// ── 공시 목록 (10단계) ──────────────────────────────────────────────
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

export async function fetchDisclosures(code: string, key: string): Promise<Disclosure[]> {
  const end = new Date();
  const bgn = new Date(Date.now() - 180 * 86400000);
  const url = `${BASE}/list.json?crtfc_key=${key}&corp_code=${code}&bgn_de=${ymd(bgn)}&end_de=${ymd(end)}&page_count=40`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  const j = await res.json();
  if (j.status === "013") return []; // 조회된 데이터 없음
  if (j.status !== "000") throw new Error(`list: ${j.status} ${j.message ?? ""}`);
  return withTags(
    (j.list as Record<string, string>[]).map((r) => ({
      id: r.rcept_no,
      title: r.report_nm.trim(),
      date: `${r.rcept_dt.slice(0, 4)}-${r.rcept_dt.slice(4, 6)}-${r.rcept_dt.slice(6)}`,
      filer: r.flr_nm,
      url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${r.rcept_no}`,
    })),
  );
}

// ── 재무제표 (8단계) ────────────────────────────────────────────────
interface Acnt {
  account_nm: string;
  sj_div: string;
  thstrm_amount: string;
}

const num = (s: string | undefined) => {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function pick(list: Acnt[], sj: string[], names: string[]): number {
  for (const name of names) {
    const hit = list.find(
      (a) => sj.includes(a.sj_div) && a.account_nm.replace(/\s/g, "").startsWith(name),
    );
    if (hit) return num(hit.thstrm_amount);
  }
  return 0;
}

async function fetchAccounts(code: string, key: string, year: number, fs: "CFS" | "OFS") {
  const url = `${BASE}/fnlttSinglAcntAll.json?crtfc_key=${key}&corp_code=${code}&bsns_year=${year}&reprt_code=11011&fs_div=${fs}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  const j = await res.json();
  if (j.status !== "000") return null;
  return j.list as Acnt[];
}

export async function fetchFinancials(code: string, key: string): Promise<Financials | null> {
  const thisYear = new Date().getFullYear();
  for (const year of [thisYear - 1, thisYear - 2]) {
    for (const fs of ["CFS", "OFS"] as const) {
      const list = await fetchAccounts(code, key, year, fs);
      if (!list || list.length === 0) continue;
      const assets = pick(list, ["BS"], ["자산총계"]);
      const liabilities = pick(list, ["BS"], ["부채총계"]);
      let equity = pick(list, ["BS"], ["자본총계"]);
      if (!equity) equity = assets - liabilities;
      return {
        year,
        revenue: pick(list, ["IS", "CIS"], ["매출액", "수익(매출액)", "영업수익", "매출"]),
        operatingIncome: pick(list, ["IS", "CIS"], ["영업이익", "영업손익"]),
        netIncome: pick(list, ["IS", "CIS"], ["당기순이익", "당기순손익", "연결당기순이익", "분기순이익"]),
        assets,
        liabilities,
        equity,
        currentAssets: pick(list, ["BS"], ["유동자산"]),
        currentLiabilities: pick(list, ["BS"], ["유동부채"]),
        interestExpense: pick(list, ["IS", "CIS"], ["이자비용", "금융비용", "금융원가"]),
      };
    }
  }
  return null;
}
