// 외부 서버에 못 나가는 환경에서도 파싱 로직을 확인하기 위해 가짜 응답으로 점검한다
import { zipSync, strToU8 } from "fflate";
import { fetchDisclosures, fetchFinancials, searchCorps } from "../src/lib/dart";
import { fetchNews } from "../src/lib/news";

const json = (o: unknown) => new Response(JSON.stringify(o));
const corpXml = `<?xml version="1.0" encoding="UTF-8"?><result>
<list><corp_code>00126380</corp_code><corp_name>삼성전자</corp_name><corp_eng_name>SAMSUNG</corp_eng_name><stock_code>005930</stock_code><modify_date>20240101</modify_date></list>
<list><corp_code>00000001</corp_code><corp_name>비상장회사</corp_name><stock_code> </stock_code><modify_date>20240101</modify_date></list>
<list><corp_code>00164779</corp_code><corp_name>SK하이닉스</corp_name><corp_eng_name>SK hynix</corp_eng_name><stock_code>000660</stock_code><modify_date>20240101</modify_date></list></result>`;

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.includes("corpCode.xml")) {
    return new Response(zipSync({ "CORPCODE.xml": strToU8(corpXml) }));
  }
  if (url.includes("list.json"))
    return json({ status: "000", list: [
      { rcept_no: "20261101000123", report_nm: "유상증자결정", rcept_dt: "20261101", flr_nm: "테스트" },
      { rcept_no: "20261020000456", report_nm: "분기보고서 (2026.09)", rcept_dt: "20261020", flr_nm: "테스트" },
    ] });
  if (url.includes("fnlttSinglAcntAll"))
    return json({ status: "000", list: [
      { sj_div: "BS", account_nm: "유동자산", thstrm_amount: "1,000" },
      { sj_div: "BS", account_nm: "자산총계", thstrm_amount: "5,000" },
      { sj_div: "BS", account_nm: "유동부채", thstrm_amount: "500" },
      { sj_div: "BS", account_nm: "부채총계", thstrm_amount: "2,000" },
      { sj_div: "BS", account_nm: "자본총계", thstrm_amount: "3,000" },
      { sj_div: "IS", account_nm: "매출액", thstrm_amount: "10,000" },
      { sj_div: "IS", account_nm: "영업이익(손실)", thstrm_amount: "-300" },
      { sj_div: "IS", account_nm: "당기순이익(손실)", thstrm_amount: "-400" },
      { sj_div: "IS", account_nm: "이자비용", thstrm_amount: "50" },
    ] });
  if (url.includes("news.google.com"))
    return new Response(`<rss><channel>
<item><title>테스트전자, 3분기 적자 확대 &amp; 주가 급락 - 데모일보</title><link>https://example.com/a</link><pubDate>Mon, 16 Nov 2026 09:00:00 GMT</pubDate><source url="https://x">데모일보</source></item>
<item><title>테스트전자 수주 확대 - 경제신문</title><link>https://example.com/b</link><pubDate>Sun, 15 Nov 2026 09:00:00 GMT</pubDate><source url="https://y">경제신문</source></item>
</channel></rss>`);
  throw new Error("unexpected " + url);
}) as typeof fetch;

const assert = (c: boolean, m: string) => { console.log(c ? "OK  " : "FAIL", m); if (!c) process.exitCode = 1; };

const s1 = await searchCorps("삼성", "k");
assert(s1.length === 1 && s1[0].code === "00126380", "회사명 검색 (상장사만, 이름 일치)");
const s2 = await searchCorps("000660", "k");
assert(s2.length === 1 && s2[0].name === "SK하이닉스", "종목코드 검색");
const d = await fetchDisclosures("1", "k");
assert(d.length === 2 && d[0].tags[0]?.label === "유상증자" && d[0].date === "2026-11-01", "공시 목록 + 위험 태그 + 날짜");
const f = await fetchFinancials("1", "k");
assert(!!f && f.revenue === 10000 && f.operatingIncome === -300 && f.equity === 3000 && f.interestExpense === 50, "재무제표 계정 추출(음수·콤마)");
const n = await fetchNews("테스트전자");
assert(n.length === 2 && n[0].title === "테스트전자, 3분기 적자 확대 & 주가 급락" && n[0].sentiment === "neg" && n[1].sentiment === "pos", "뉴스 제목 정리 + 감성 분류");
