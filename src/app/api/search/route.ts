import { NextRequest } from "next/server";
import { dartKey, searchCorps } from "@/lib/dart";
import { demoList, searchDemo } from "@/lib/demo-data";

export const maxDuration = 60; // 미리 만든 목록이 없을 때 실시간 다운로드 대비

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const key = dartKey();

  if (!key) {
    return Response.json({
      results: searchDemo(q),
      demo: true,
      notice: "DART 인증키가 없어 데모 기업만 보여 드립니다.",
    });
  }

  try {
    const results = await searchCorps(q, key);
    return Response.json({ results, demo: false });
  } catch (e) {
    return Response.json({
      results: q ? searchDemo(q) : demoList(),
      demo: true,
      notice: `공시 서버 연결에 실패해 데모 기업을 보여 드립니다. (${(e as Error).message})`,
    });
  }
}
