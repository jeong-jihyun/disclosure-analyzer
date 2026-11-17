import { NextRequest } from "next/server";
import { dartKey, searchCorps } from "@/lib/dart";

export const maxDuration = 60; // 미리 만든 목록이 없을 때 실시간 다운로드 대비

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const key = dartKey();

  if (!key) {
    return Response.json({
      results: [],
      demo: false,
      notice: "DART 인증키가 설정되지 않아 검색할 수 없습니다. 환경변수 DART_API_KEY를 확인해 주세요.",
    });
  }

  try {
    const results = await searchCorps(q, key);
    return Response.json({ results, demo: false });
  } catch (e) {
    return Response.json({
      results: [],
      demo: false,
      notice: `공시 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요. (${(e as Error).message})`,
    });
  }
}
