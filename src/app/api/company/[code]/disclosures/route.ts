import { NextRequest } from "next/server";
import { dartKey, fetchDisclosuresPage } from "@/lib/dart";

export const maxDuration = 30;

/** 공시 더 보기: ?months=12&type=B&page=2 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/company/[code]/disclosures">) {
  const { code } = await ctx.params;
  const key = dartKey();
  if (code.startsWith("DEMO") || !key) {
    return Response.json({ items: [], hasMore: false, demo: true });
  }
  const sp = req.nextUrl.searchParams;
  try {
    const page = await fetchDisclosuresPage(code, key, {
      months: Number(sp.get("months")) || 6,
      type: sp.get("type") || undefined,
      page: Number(sp.get("page")) || 1,
    });
    return Response.json(page);
  } catch (e) {
    return Response.json({ error: `공시를 가져오지 못했습니다. (${(e as Error).message})` }, { status: 502 });
  }
}
