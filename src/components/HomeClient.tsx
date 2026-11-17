"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoList } from "@/lib/demo-data";
import { clearRecent, FAV_KEY, RECENT_KEY, useStoredList } from "@/lib/storage";
import type { CompanyInfo } from "@/lib/types";
import { Logo, SITE_NAME } from "./Logo";
import { Card, Disclaimer, Notice } from "./ui";

export function HomeClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CompanyInfo[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const favs = useStoredList(FAV_KEY);
  const recent = useStoredList(RECENT_KEY);

  // 입력이 멈추고 0.3초 뒤에 검색 (글자마다 서버를 부르지 않도록)
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    let alive = true;
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((j) => {
          if (!alive) return;
          setResults(j.results ?? []);
          setNotice(j.notice ?? null);
        })
        .catch(() => alive && setNotice("검색 중 오류가 났습니다. 잠시 뒤 다시 시도해 주세요."))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const searching = q.trim().length > 0;

  return (
    <div className="min-h-dvh">
      <header className="bg-slate-900 text-white">
        <div className="rainbow-bar h-1.5" />
        <div className="px-4 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div>
            <h1 className="rainbow-text text-xl font-extrabold leading-tight">{SITE_NAME}</h1>
            <p className="text-xs text-slate-300">공시 분석 · 공시·재무·뉴스로 기업 위험도를 한눈에</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-slate-900">
          <span aria-hidden>🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="회사명 또는 종목코드"
            aria-label="회사 검색"
            enterKeyHint="search"
            className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="지우기" className="text-slate-400">✕</button>
          )}
        </div>
        </div>
      </header>

      <main className="space-y-3 p-3">
        {searching ? (
          <Card title={loading ? "검색 중…" : `검색 결과 ${results?.length ?? 0}건`}>
            {notice && <div className="mb-3"><Notice>{notice}</Notice></div>}
            <List items={results ?? []} empty={loading ? "" : "일치하는 상장사가 없습니다."} />
          </Card>
        ) : (
          <>
            {favs.length > 0 && (
              <Card title="★ 관심 기업">
                <List items={favs} />
              </Card>
            )}
            {recent.length > 0 && (
              <Card
                title="최근 본 기업"
                right={
                  <button onClick={clearRecent} className="text-xs text-slate-400">비우기</button>
                }
              >
                <List items={recent} />
              </Card>
            )}
            <Card title="데모 기업 (가상)">
              <p className="mb-2 text-xs text-slate-400">
                실제 기업이 아닌 가상 기업입니다. 안정 → 위험 순서로 점수 화면을 미리 볼 수 있어요.
              </p>
              <List items={demoList()} />
            </Card>
          </>
        )}
        <Disclaimer />
      </main>
    </div>
  );
}

function List({ items, empty }: { items: CompanyInfo[]; empty?: string }) {
  if (items.length === 0) return empty ? <p className="py-4 text-center text-sm text-slate-400">{empty}</p> : null;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((c) => (
        <li key={c.code}>
          <Link
            href={`/company/${encodeURIComponent(c.code)}`}
            className="flex items-center justify-between py-3 active:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{c.name}</span>
              <span className="block text-[11px] text-slate-400">
                {[c.market, c.stockCode].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="text-slate-300">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
