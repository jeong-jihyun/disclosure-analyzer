// 외부 서버에 못 나가는 환경에서도 파싱 로직을 확인하기 위해 가짜 응답으로 점검한다
import { zipSync, strToU8 } from "fflate";
import { fetchDisclosuresPage, fetchDividends, fetchFinancialSeries, fetchOfficers, fetchShareholders, searchCorps } from "../src/lib/dart";
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
  if (url.includes("hyslrSttus"))
    return json({ status: "000", list: [
      { nm: "홍길동", relate: "최대주주", stock_knd: "보통주", trmend_posesn_stock_co: "1,000,000", trmend_posesn_stock_qota_rt: "20.50" },
      { nm: "홍길동", relate: "최대주주", stock_knd: "우선주", trmend_posesn_stock_co: "5", trmend_posesn_stock_qota_rt: "1.00" },
      { nm: "김영희", relate: "친인척", stock_knd: "보통주", trmend_posesn_stock_co: "300,000", trmend_posesn_stock_qota_rt: "6.1" },
      { nm: "계", relate: "-", stock_knd: "보통주", trmend_posesn_stock_co: "1,300,000", trmend_posesn_stock_qota_rt: "26.6" },
    ] });
  if (url.includes("alotMatter"))
    return json({ status: "000", list: [
      { se: "주당 현금배당금(원)", stock_knd: "보통주", thstrm: "500", frmtrm: "450", lwfr: "400" },
      { se: "주당 현금배당금(원)", stock_knd: "우선주", thstrm: "550", frmtrm: "500", lwfr: "450" },
      { se: "현금배당수익률(%)", stock_knd: "보통주", thstrm: "1.8", frmtrm: "1.6", lwfr: "1.5" },
      { se: "액면주당순이익(원)", thstrm: "1000", frmtrm: "900", lwfr: "800" },
    ] });
  if (url.includes("exctvSttus"))
    return json({ status: "000", list: [
      { nm: "홍길동", ofcps: "대표이사", rgist_exctv_at: "등기임원", chrg_job: "총괄" },
      { nm: "이사람", ofcps: "사외이사", rgist_exctv_at: "등기임원", chrg_job: "감사위원" },
    ] });
  if (url.includes("list.json"))
    return json({ status: "000", page_no: 1, total_page: 3, list: [
      { rcept_no: "20261101000123", report_nm: "유상증자결정", rcept_dt: "20261101", flr_nm: "테스트" },
      { rcept_no: "20261020000456", report_nm: "분기보고서 (2026.09)", rcept_dt: "20261020", flr_nm: "테스트" },
    ] });
  if (url.includes("fnlttSinglAcntAll"))
    return json({ status: "000", list: [
      { sj_div: "BS", account_nm: "유동자산", thstrm_amount: "1,000", frmtrm_amount: "900", bfefrmtrm_amount: "800" },
      { sj_div: "BS", account_nm: "자산총계", thstrm_amount: "5,000", frmtrm_amount: "4,500", bfefrmtrm_amount: "4,000" },
      { sj_div: "BS", account_nm: "유동부채", thstrm_amount: "500", frmtrm_amount: "450", bfefrmtrm_amount: "400" },
      { sj_div: "BS", account_nm: "부채총계", thstrm_amount: "2,000", frmtrm_amount: "1,800", bfefrmtrm_amount: "1,600" },
      { sj_div: "BS", account_nm: "자본총계", thstrm_amount: "3,000", frmtrm_amount: "2,700", bfefrmtrm_amount: "2,400" },
      { sj_div: "IS", account_nm: "매출액", thstrm_amount: "10,000", frmtrm_amount: "9,000", bfefrmtrm_amount: "8,000" },
      { sj_div: "IS", account_nm: "영업이익(손실)", thstrm_amount: "-300", frmtrm_amount: "100", bfefrmtrm_amount: "200" },
      { sj_div: "IS", account_nm: "당기순이익(손실)", thstrm_amount: "-400", frmtrm_amount: "50", bfefrmtrm_amount: "150" },
      { sj_div: "IS", account_nm: "이자비용", thstrm_amount: "50", frmtrm_amount: "40", bfefrmtrm_amount: "30" },
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
const dp = await fetchDisclosuresPage("1", "k", { months: 12, type: "B", page: 1 });
assert(dp.items.length === 2 && dp.items[0].tags[0]?.label === "유상증자" && dp.items[0].date === "2026-11-01" && dp.hasMore === true, "공시 목록 + 위험 태그 + 날짜 + 더보기 여부");
const fs = await fetchFinancialSeries("1", "k");
const last = fs[fs.length - 1];
assert(fs.length === 3 && fs[0].revenue === 8000 && fs[1].revenue === 9000 && last.revenue === 10000, "재무 3개년 추이(오래된 해→최신)");
assert(last.operatingIncome === -300 && last.equity === 3000 && last.interestExpense === 50 && fs[0].year === last.year - 2, "재무 계정 추출(음수·콤마·연도)");
const sh = await fetchShareholders("1", "k");
assert(sh.length === 2 && sh[0].name === "홍길동" && sh[0].ratio === 20.5 && sh[0].shares === 1000000, "최대주주(보통주만, '계' 제외, 지분율 순)");
const dv = await fetchDividends("1", "k");
assert(dv.length === 2 && dv[0].current === "500" && dv[1].item.includes("수익률"), "배당(보통주·관심 항목만)");
const of = await fetchOfficers("1", "k");
assert(of.length === 2 && of[0].position === "대표이사", "임원 현황");
const n = await fetchNews("테스트전자");
assert(n.length === 2 && n[0].title === "테스트전자, 3분기 적자 확대 & 주가 급락" && n[0].sentiment === "neg" && n[1].sentiment === "pos", "뉴스 제목 정리 + 감성 분류");
