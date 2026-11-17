"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeScore, GRADE_STYLE, toEok } from "@/lib/score";
import { FAV_KEY, pushRecent, toggleFavorite, useStoredList } from "@/lib/storage";
import type { CompanyBundle, Metrics, ScoreResult } from "@/lib/types";
import { PartBar, Radar, ScoreGauge } from "./charts";
import { Detail } from "./Detail";
import { Feed } from "./Feed";
import { Simulator } from "./Simulator";
import { Card, Disclaimer, Notice, RiskChip, SentimentChip } from "./ui";

type Tab = "summary" | "detail" | "feed" | "sim" | "info";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "summary", label: "요약", icon: "📊" },
  { id: "detail", label: "상세", icon: "📈" },
  { id: "feed", label: "공시·뉴스", icon: "📰" },
  { id: "sim", label: "시뮬레이션", icon: "🧪" },
  { id: "info", label: "기업정보", icon: "🏢" },
];

export function CompanyView({ code }: { code: string }) {
  const [bundle, setBundle] = useState<CompanyBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const favs = useStoredList(FAV_KEY);

  useEffect(() => {
    let alive = true;
    fetch(`/api/company/${encodeURIComponent(code)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "불러오지 못했습니다.");
        return j as CompanyBundle;
      })
      .then((b) => {
        if (!alive) return;
        setBundle(b);
        pushRecent(b.info);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [code]);

  const score = useMemo(
    () => (bundle ? computeScore(bundle.financials, bundle.disclosures, bundle.news) : null),
    [bundle],
  );

  if (error) {
    return (
      <div className="p-4">
        <Link href="/" className="text-sm text-slate-500">← 처음으로</Link>
        <div className="mt-4">
          <Notice tone="warn">{error}</Notice>
        </div>
      </div>
    );
  }
  if (!bundle) return <Skeleton />;

  const isFav = favs.some((f) => f.code === bundle.info.code);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-slate-900 px-3 py-3 text-white">
        <Link href="/" aria-label="뒤로" className="rounded-full px-2 py-1 text-lg active:bg-white/10">←</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold">{bundle.info.name}</h1>
          <p className="truncate text-[11px] text-slate-300">
            {[bundle.info.market, bundle.info.stockCode].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(bundle.info)}
          aria-label={isFav ? "관심 기업에서 빼기" : "관심 기업에 담기"}
          aria-pressed={isFav}
          className="rounded-full px-2 py-1 text-xl active:bg-white/10"
        >
          {isFav ? "★" : "☆"}
        </button>
      </header>

      <main className="flex-1 space-y-3 p-3 pb-24">
        {bundle.notice && <Notice tone={bundle.demo ? "info" : "warn"}>{bundle.notice}</Notice>}
        {tab === "summary" && <Summary bundle={bundle} score={score} />}
        {tab === "detail" && <Detail bundle={bundle} />}
        {tab === "feed" && <Feed bundle={bundle} />}
        {tab === "sim" && <Simulator bundle={bundle} />}
        {tab === "info" && <Info bundle={bundle} />}
        <Disclaimer />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-md grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              window.scrollTo({ top: 0 });
            }}
            aria-current={tab === t.id ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${tab === t.id ? "font-semibold text-slate-900" : "text-slate-400"}`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-3">
      <div className="h-12 rounded-xl bg-slate-200" />
      <div className="h-56 rounded-2xl bg-slate-200" />
      <div className="h-40 rounded-2xl bg-slate-200" />
      <p className="text-center text-xs text-slate-400">공시·재무·뉴스를 모으는 중…</p>
    </div>
  );
}

// ── 요약 탭 (13단계 대시보드) ──────────────────────────────────────
function Summary({ bundle, score }: { bundle: CompanyBundle; score: ScoreResult | null }) {
  const f = bundle.financials;
  if (!score || !f) {
    return (
      <Card title="점수를 계산할 수 없습니다">
        <p className="text-sm text-slate-600">
          최근 사업연도 재무제표를 찾지 못했습니다. 공시·뉴스 탭에서 다른 정보를 확인해 주세요.
        </p>
      </Card>
    );
  }
  const st = GRADE_STYLE[score.grade];
  const weakest = weakestPart(score);
  const topTags = bundle.disclosures
    .flatMap((d) => d.tags)
    .filter((t) => t.severity >= 2)
    .reduce<Record<string, { n: number; sev: number }>>((acc, t) => {
      acc[t.label] = { n: (acc[t.label]?.n ?? 0) + 1, sev: t.severity };
      return acc;
    }, {});
  const negNews = bundle.news.filter((n) => n.sentiment === "neg").length;

  return (
    <>
      <Card>
        <ScoreGauge score={score.total} grade={score.grade} />
        <p className={`mt-3 rounded-xl px-3 py-2 text-center text-sm ${st.bg} ${st.text}`}>
          {summaryLine(score, weakest)}
        </p>
      </Card>

      <Card title="영역별 점수">
        <Radar parts={score.parts} color={st.hex} />
        <div className="mt-3 space-y-3">
          <PartBar label="재무 안정성" value={score.parts.stability} max={40} color={st.hex} />
          <PartBar label="수익성" value={score.parts.profit} max={25} color={st.hex} />
          <PartBar label="공시 신호" value={score.parts.disclosure} max={20} color={st.hex} />
          <PartBar label="뉴스 분위기" value={score.parts.news} max={15} color={st.hex} />
        </div>
      </Card>

      <Card title="핵심 지표">
        <MetricGrid m={score.metrics} />
      </Card>

      <Card title="눈여겨볼 신호">
        {Object.keys(topTags).length === 0 && negNews === 0 ? (
          <p className="text-sm text-slate-500">최근 눈에 띄는 위험 공시·부정 뉴스가 없습니다.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {Object.entries(topTags).map(([label, v]) => (
              <li key={label} className="flex items-center justify-between">
                <RiskChip tag={{ label, severity: v.sev as 2 | 3 }} />
                <span className="text-slate-500">최근 공시 {v.n}건</span>
              </li>
            ))}
            {negNews > 0 && (
              <li className="flex items-center justify-between">
                <SentimentChip s="neg" />
                <span className="text-slate-500">최근 뉴스 {negNews}건</span>
              </li>
            )}
          </ul>
        )}
      </Card>

      <Card title={`재무 요약 (${f.year}년 사업연도)`}>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <Fin label="매출액" v={f.revenue} />
          <Fin label="영업이익" v={f.operatingIncome} />
          <Fin label="당기순이익" v={f.netIncome} />
          <Fin label="자산총계" v={f.assets} />
          <Fin label="부채총계" v={f.liabilities} />
          <Fin label="자본총계" v={f.equity} />
        </dl>
      </Card>
    </>
  );
}

function Fin({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`font-semibold tabular-nums ${v < 0 ? "text-rose-600" : ""}`}>{toEok(v)}원</dd>
    </div>
  );
}

function weakestPart(s: ScoreResult): string {
  const ratios: [string, number][] = [
    ["재무 안정성", s.parts.stability / 40],
    ["수익성", s.parts.profit / 25],
    ["공시 신호", s.parts.disclosure / 20],
    ["뉴스 분위기", s.parts.news / 15],
  ];
  ratios.sort((a, b) => a[1] - b[1]);
  return ratios[0][0];
}

function summaryLine(s: ScoreResult, weakest: string): string {
  if (s.grade === "안정") return `전반적으로 안정적입니다. 상대적으로 약한 부분은 '${weakest}'입니다.`;
  if (s.grade === "보통") return `무난한 편입니다. 가장 약한 부분은 '${weakest}'입니다.`;
  if (s.grade === "주의") return `주의가 필요합니다. 특히 '${weakest}'을(를) 살펴보세요.`;
  return `위험 신호가 많습니다. '${weakest}'이(가) 가장 취약합니다.`;
}

function MetricGrid({ m }: { m: Metrics }) {
  const items = [
    { label: "부채비율", value: `${Math.min(m.debtRatio, 999).toFixed(0)}%`, hint: "낮을수록 좋음 (100% 이하 양호)", level: m.debtRatio <= 100 ? 0 : m.debtRatio <= 200 ? 1 : 2 },
    { label: "유동비율", value: `${Math.min(m.currentRatio, 999).toFixed(0)}%`, hint: "높을수록 좋음 (150% 이상 양호)", level: m.currentRatio >= 150 ? 0 : m.currentRatio >= 100 ? 1 : 2 },
    { label: "영업이익률", value: `${m.opMargin.toFixed(1)}%`, hint: "높을수록 좋음 (5% 이상 양호)", level: m.opMargin >= 5 ? 0 : m.opMargin >= 0 ? 1 : 2 },
    { label: "이자보상배율", value: m.interestCover >= 99 ? "99+배" : `${m.interestCover.toFixed(1)}배`, hint: "1배 미만이면 이자도 못 냄", level: m.interestCover >= 3 ? 0 : m.interestCover >= 1 ? 1 : 2 },
  ];
  const dot = ["bg-emerald-500", "bg-amber-500", "bg-rose-500"];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`inline-block h-2 w-2 rounded-full ${dot[it.level]}`} />
            {it.label}
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums">{it.value}</div>
          <div className="mt-0.5 text-[10px] leading-tight text-slate-400">{it.hint}</div>
        </div>
      ))}
    </div>
  );
}

// ── 기업정보 탭 (7단계) ────────────────────────────────────────────
function Info({ bundle }: { bundle: CompanyBundle }) {
  const i = bundle.info;
  const rows: [string, string | undefined][] = [
    ["회사명", i.name],
    ["대표자", i.ceo],
    ["상장 시장", i.market],
    ["종목코드", i.stockCode],
    ["업종", i.industry],
    ["설립일", i.established],
    ["주소", i.address],
  ];
  return (
    <>
      <Card title="기업 개황">
        <dl className="divide-y divide-slate-100 text-sm">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex gap-3 py-2">
                <dt className="w-20 shrink-0 text-slate-400">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
        </dl>
      </Card>
      {!bundle.demo && (
        <Card title="바로가기">
          <div className="flex flex-col gap-2 text-sm">
            {i.homepage && <A href={i.homepage}>회사 홈페이지</A>}
            <A href={`https://dart.fss.or.kr/dsab007/main.do?option=corp&textCrpNm=${encodeURIComponent(i.name)}`}>DART에서 전체 공시 보기</A>
            {i.stockCode && <A href={`https://finance.naver.com/item/main.naver?code=${i.stockCode}`}>네이버 증권 시세</A>}
          </div>
        </Card>
      )}
    </>
  );
}

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-50 px-3 py-2.5 text-slate-700 active:bg-slate-100">
    {children} ↗
  </a>
);
