import { NextRequest } from "next/server";
import {
  dartKey,
  fetchCompany,
  fetchDisclosures,
  fetchDividends,
  fetchFinancialSeries,
  fetchOfficers,
  fetchShareholders,
} from "@/lib/dart";
import { getDemoBundle } from "@/lib/demo-data";
import { fetchNews } from "@/lib/news";
import type { CompanyBundle } from "@/lib/types";

export const maxDuration = 60;

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/company/[code]">) {
  const { code } = await ctx.params;

  // 데모 기업
  if (code.startsWith("DEMO")) {
    const bundle = getDemoBundle(code);
    if (!bundle) return Response.json({ error: "데모 기업을 찾을 수 없습니다." }, { status: 404 });
    return Response.json(bundle);
  }

  const key = dartKey();
  if (!key) {
    return Response.json(
      { error: "DART 인증키가 설정되지 않았습니다. 환경변수 DART_API_KEY를 확인해 주세요." },
      { status: 400 },
    );
  }

  try {
    const info = await fetchCompany(code, key);
    // 서로 상관없는 것들은 동시에 가져오고, 하나가 실패해도 나머지는 보여 준다
    const [series, disc, news, holders, divs, officers] = await Promise.allSettled([
      fetchFinancialSeries(code, key),
      fetchDisclosures(code, key),
      fetchNews(info.name),
      fetchShareholders(code, key),
      fetchDividends(code, key),
      fetchOfficers(code, key),
    ]);
    const notes: string[] = [];
    const history = series.status === "fulfilled" ? series.value : [];
    if (series.status === "rejected") notes.push("재무제표를 가져오지 못했습니다.");
    if (series.status === "fulfilled" && history.length === 0)
      notes.push("최근 사업연도 재무제표가 없어 점수를 계산할 수 없습니다.");
    if (disc.status === "rejected") notes.push("공시 목록을 가져오지 못했습니다.");
    if (news.status === "rejected") notes.push("뉴스를 가져오지 못했습니다.");
    if (holders.status === "rejected" || divs.status === "rejected" || officers.status === "rejected")
      notes.push("주주·배당·임원 정보 일부를 가져오지 못했습니다.");

    const empty = history.length === 0 && disc.status === "fulfilled" && disc.value.length === 0;
    if (empty)
      notes.push(
        "이 항목에는 DART 재무·공시 자료가 없습니다. 합병·상장폐지로 더 이상 쓰이지 않는 옛 법인일 수 있어요. 같은 이름의 다른 항목을 검색해서 종목코드가 다른 것을 선택해 보세요.",
      );
    const bundle: CompanyBundle = {
      info,
      financials: history.length ? history[history.length - 1] : null,
      history,
      shareholders: holders.status === "fulfilled" ? holders.value : [],
      dividends: divs.status === "fulfilled" ? divs.value : [],
      officers: officers.status === "fulfilled" ? officers.value : [],
      disclosures: disc.status === "fulfilled" ? disc.value : [],
      news: news.status === "fulfilled" ? news.value : [],
      demo: false,
      notice: notes.length ? notes.join(" ") : undefined,
    };
    return Response.json(bundle);
  } catch (e) {
    return Response.json({ error: `기업 정보를 가져오지 못했습니다. (${(e as Error).message})` }, { status: 502 });
  }
}
