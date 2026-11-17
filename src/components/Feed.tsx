"use client";

import { useState } from "react";
import { explainDisclosure, TONE_STYLE } from "@/lib/explain";
import type { CompanyBundle, Disclosure } from "@/lib/types";
import { RiskChip, SentimentChip } from "./ui";

const PERIODS = [
  { months: 6, label: "6개월" },
  { months: 12, label: "1년" },
  { months: 24, label: "2년" },
];

const TYPES = [
  { type: "", label: "전체" },
  { type: "A", label: "정기보고서" },
  { type: "B", label: "주요사항" },
  { type: "C", label: "발행" },
  { type: "D", label: "지분" },
  { type: "E", label: "기타" },
];

export function Feed({ bundle }: { bundle: CompanyBundle }) {
  const [seg, setSeg] = useState<"disc" | "news">(bundle.disclosures.length === 0 && bundle.news.length > 0 ? "news" : "disc");
  return (
    <>
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 text-sm">
        {(["disc", "news"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeg(s)}
            className={`rounded-lg py-2 ${seg === s ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}
          >
            {s === "disc" ? "공시" : `뉴스 ${bundle.news.length}`}
          </button>
        ))}
      </div>
      {seg === "disc" ? <DisclosureList bundle={bundle} /> : <NewsList bundle={bundle} />}
    </>
  );
}

// ── 공시: 기간·종류 필터 + 더보기 + 쉬운 설명 ───────────────────────
function DisclosureList({ bundle }: { bundle: CompanyBundle }) {
  const code = bundle.info.code;
  const canFilter = !bundle.demo;
  const [months, setMonths] = useState(6);
  const [type, setType] = useState("");
  const [items, setItems] = useState<Disclosure[]>(bundle.disclosures);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(bundle.disclosures.length >= 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextMonths: number, nextType: string, nextPage: number) {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ months: String(nextMonths), page: String(nextPage) });
      if (nextType) q.set("type", nextType);
      const r = await fetch(`/api/company/${encodeURIComponent(code)}/disclosures?${q}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "불러오지 못했습니다.");
      setItems((prev) => (nextPage === 1 ? j.items : [...prev, ...j.items]));
      setHasMore(Boolean(j.hasMore));
      setPage(nextPage);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const changeFilter = (m: number, t: string) => {
    setMonths(m);
    setType(t);
    load(m, t, 1);
  };

  return (
    <>
      {canFilter && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <Chip key={p.months} active={months === p.months} onClick={() => changeFilter(p.months, type)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <Chip key={t.type} active={type === t.type} onClick={() => changeFilter(months, t.type)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {error && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">{error}</p>}

      {items.length === 0 && !loading ? (
        <Empty text="조건에 맞는 공시가 없습니다." />
      ) : (
        <ul className="space-y-2">
          {items.map((d) => (
            <DisclosureCard key={d.id} d={d} />
          ))}
        </ul>
      )}

      {loading && <p className="py-2 text-center text-xs text-slate-400">불러오는 중…</p>}
      {hasMore && !loading && canFilter && (
        <button
          onClick={() => load(months, type, page + 1)}
          className="w-full rounded-xl bg-white py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 active:bg-slate-50"
        >
          더 보기
        </button>
      )}
      {!canFilter && (
        <p className="text-center text-[11px] text-slate-400">데모 기업에서는 기간·종류 필터와 더 보기가 없습니다.</p>
      )}
    </>
  );
}

function DisclosureCard({ d }: { d: Disclosure }) {
  const [open, setOpen] = useState(false);
  const ex = explainDisclosure(d.title);
  const cls = "block rounded-t-xl p-3 active:bg-slate-50";
  const body = (
    <>
      <p className="text-sm font-medium leading-snug">{d.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-400">{d.date}</span>
        {d.tags.map((t) => (
          <RiskChip key={t.label} tag={t} />
        ))}
      </div>
    </>
  );
  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">
      {d.url && d.url !== "#" ? (
        <a href={d.url} target="_blank" rel="noopener noreferrer" className={cls}>
          {body}
        </a>
      ) : (
        <div className={cls}>{body}</div>
      )}
      {ex && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 active:bg-slate-50"
          >
            <span>💡 이게 무슨 공시예요?</span>
            <span className="text-slate-400">{open ? "접기 ▲" : "보기 ▼"}</span>
          </button>
          {open && (
            <div className={`mx-3 mb-3 rounded-lg p-3 text-xs leading-relaxed ring-1 ${TONE_STYLE[ex.tone].box}`}>
              <p className="mb-1 font-semibold">
                {ex.name} <span className="font-normal opacity-70">· {TONE_STYLE[ex.tone].label}</span>
              </p>
              <p>{ex.easy}</p>
              <p className="mt-1.5">
                <span className="font-semibold">확인할 점: </span>
                {ex.check}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ${active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
    >
      {children}
    </button>
  );
}

// ── 뉴스 ──────────────────────────────────────────────────────────
function NewsList({ bundle }: { bundle: CompanyBundle }) {
  if (bundle.news.length === 0) return <Empty text="최근 한 달 뉴스가 없습니다." />;
  return (
    <ul className="space-y-2">
      {bundle.news.map((n, i) => {
        const cls = "block rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50";
        const body = (
          <>
            <p className="text-sm font-medium leading-snug">{n.title}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <SentimentChip s={n.sentiment} />
              <span className="text-[11px] text-slate-400">
                {n.source} · {n.date}
              </span>
            </div>
          </>
        );
        return (
          <li key={i}>
            {n.link && n.link !== "#" ? (
              <a href={n.link} target="_blank" rel="noopener noreferrer" className={cls}>
                {body}
              </a>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const Empty = ({ text }: { text: string }) => (
  <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-200/70">{text}</p>
);
