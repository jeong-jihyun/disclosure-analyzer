"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearRecent, FAV_KEY, RECENT_KEY, useStoredList } from "@/lib/storage";
import type { CompanyInfo, NewsItem } from "@/lib/types";
import { Logo, SITE_NAME } from "./Logo";
import { Card, Disclaimer, Notice, SentimentChip } from "./ui";

export function HomeClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CompanyInfo[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const favs = useStoredList(FAV_KEY);
  const recent = useStoredList(RECENT_KEY);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [newsFailed, setNewsFailed] = useState(false);

  // 첫 화면 최근 동향 뉴스 (한 번만 불러옴)
  useEffect(() => {
    let alive = true;
    fetch("/api/news")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const items: NewsItem[] = j.items ?? [];
        setNews(items);
        setNewsFailed(items.length === 0);
      })
      .catch(() => alive && (setNews([]), setNewsFailed(true)));
    return () => {
      alive = false;
    };
  }, []);

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
            {favs.length === 0 && recent.length === 0 && (
              <Card title="회사를 찾아보세요">
                <p className="mb-3 text-xs text-slate-400">위 검색창에 회사명이나 종목코드를 입력하세요. 예를 들어</p>
                <div className="flex flex-wrap gap-2">
                  {["삼성전자", "네이버", "카카오", "현대차"].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQ(n)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 active:bg-slate-200"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </Card>
            )}
            <Card title="최근 동향 뉴스">
              {news === null ? (
                <ul className="space-y-3" aria-label="뉴스 불러오는 중">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="space-y-1.5">
                      <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-100" />
                    </li>
                  ))}
                </ul>
              ) : newsFailed ? (
                <p className="py-3 text-center text-sm text-slate-400">
                  뉴스를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-slate-100">
                    {news.map((n, i) => (
                      <li key={i}>
                        <a
                          href={n.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block py-2.5 active:bg-slate-50"
                        >
                          <p className="text-sm font-medium leading-snug text-slate-800">{n.title}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <SentimentChip s={n.sentiment} />
                            <span className="text-[11px] text-slate-400">
                              {n.source} · {n.date}
                            </span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-slate-400">구글 뉴스 · 최근 3일 · 기사를 누르면 원문으로 이동</p>
                </>
              )}
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
