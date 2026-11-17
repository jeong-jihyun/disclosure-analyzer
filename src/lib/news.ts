import { withSentiment } from "./classify";
import type { NewsItem } from "./types";

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();

const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

function parseRss(xml: string, limit: number): NewsItem[] {
  const items = xml.split("<item>").slice(1, limit + 1);
  const raw = items.map((block) => {
    const full = tag(block, "title");
    const source = tag(block, "source");
    // 구글 뉴스 제목은 "제목 - 매체명" 형식
    const title = source && full.endsWith(` - ${source}`) ? full.slice(0, -(source.length + 3)) : full;
    const pub = tag(block, "pubDate");
    const d = pub ? new Date(pub) : new Date();
    return {
      title,
      link: tag(block, "link"),
      source: source || "뉴스",
      date: isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10),
    };
  });
  return withSentiment(raw);
}

async function fetchRss(query: string, limit: number): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`news ${res.status}`);
  return parseRss(await res.text(), limit);
}

/** 회사 이름으로 최근 한 달 뉴스 가져오기 (구글 뉴스 RSS, 무료·키 없음) */
export async function fetchNews(companyName: string): Promise<NewsItem[]> {
  const name = companyName.replace(/\(가상\)/g, "").trim();
  return fetchRss(`"${name}" when:30d`, 10);
}

/** 첫 화면용: 시장·공시 전반의 최근 동향 뉴스 (최근 3일) */
export async function fetchMarketNews(): Promise<NewsItem[]> {
  return fetchRss("(증시 OR 코스피 OR 코스닥 OR 상장사 OR 공시) when:3d", 12);
}
