"use client";

import { computeMetrics, toEok } from "@/lib/score";
import type { CompanyBundle, Financials } from "@/lib/types";
import { Card } from "./ui";

export function Detail({ bundle }: { bundle: CompanyBundle }) {
  return (
    <>
      <TrendCard history={bundle.history} />
      <HolderCard bundle={bundle} />
      <DividendCard bundle={bundle} />
      <OfficerCard bundle={bundle} />
    </>
  );
}

const Empty = ({ text }: { text: string }) => <p className="py-2 text-sm text-slate-400">{text}</p>;

// ── 재무 추이 ──────────────────────────────────────────────────────
function TrendCard({ history }: { history: Financials[] }) {
  if (history.length < 2) {
    return (
      <Card title="재무 추이">
        <Empty text="여러 해 재무 정보를 가져오지 못했습니다." />
      </Card>
    );
  }
  const metrics = [
    { label: "매출액", get: (f: Financials) => f.revenue, fmt: (v: number) => toEok(v), unit: "money" },
    { label: "영업이익", get: (f: Financials) => f.operatingIncome, fmt: (v: number) => toEok(v), unit: "money" },
    { label: "당기순이익", get: (f: Financials) => f.netIncome, fmt: (v: number) => toEok(v), unit: "money" },
    { label: "부채비율", get: (f: Financials) => computeMetrics(f).debtRatio, fmt: (v: number) => `${Math.min(v, 999).toFixed(0)}%`, unit: "ratio" },
    { label: "영업이익률", get: (f: Financials) => computeMetrics(f).opMargin, fmt: (v: number) => `${v.toFixed(1)}%`, unit: "ratio" },
  ];
  return (
    <Card title={`재무 추이 (${history[0].year}~${history[history.length - 1].year}년)`}>
      <div className="space-y-5">
        {metrics.map((m) => (
          <Bars key={m.label} label={m.label} years={history.map((h) => h.year)} values={history.map(m.get)} fmt={m.fmt} lowerIsBetter={m.label === "부채비율"} />
        ))}
      </div>
    </Card>
  );
}

function Bars({
  label,
  years,
  values,
  fmt,
  lowerIsBetter,
}: {
  label: string;
  years: number[];
  values: number[];
  fmt: (v: number) => string;
  lowerIsBetter?: boolean;
}) {
  const max = Math.max(...values.map((v) => Math.abs(v)), 1e-9);
  const first = values[0];
  const last = values[values.length - 1];
  const up = last > first;
  const good = lowerIsBetter ? !up : up;
  const arrow = last === first ? "→" : up ? "▲" : "▼";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className={`text-xs font-semibold ${last === first ? "text-slate-400" : good ? "text-emerald-600" : "text-rose-600"}`}>
          {arrow} {years[0]}년 대비
        </span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((v, i) => (
          <div key={years[i]} className="text-center">
            <div className="flex h-16 items-end justify-center">
              <div
                className={`w-8 rounded-t ${v < 0 ? "bg-rose-400" : i === values.length - 1 ? "bg-slate-800" : "bg-slate-300"}`}
                style={{ height: `${Math.max(4, (Math.abs(v) / max) * 100)}%` }}
              />
            </div>
            <div className={`mt-1 text-xs font-semibold tabular-nums ${v < 0 ? "text-rose-600" : ""}`}>{fmt(v)}</div>
            <div className="text-[10px] text-slate-400">{years[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 주주 ──────────────────────────────────────────────────────────
function HolderCard({ bundle }: { bundle: CompanyBundle }) {
  const list = bundle.shareholders;
  return (
    <Card title="최대주주·특수관계인">
      {list.length === 0 ? (
        <Empty text="주주 정보가 없거나 가져오지 못했습니다." />
      ) : (
        <ul className="space-y-3">
          {list.map((h, i) => (
            <li key={h.name + i}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="min-w-0 truncate font-medium">
                  {h.name} <span className="text-xs font-normal text-slate-400">{h.relation}</span>
                </span>
                <span className="ml-2 shrink-0 font-semibold tabular-nums">{h.ratio.toFixed(2)}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${Math.min(100, h.ratio)}%` }} />
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">{h.shares.toLocaleString("ko-KR")}주</div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        최대주주 지분이 낮거나 자주 바뀌면 경영이 불안정할 수 있습니다. 정기보고서(사업보고서) 기준입니다.
      </p>
    </Card>
  );
}

// ── 배당 ──────────────────────────────────────────────────────────
function DividendCard({ bundle }: { bundle: CompanyBundle }) {
  const rows = bundle.dividends;
  const y = bundle.history.length ? bundle.history[bundle.history.length - 1].year : undefined;
  return (
    <Card title="배당 정보">
      {rows.length === 0 ? (
        <Empty text="배당 정보가 없거나(무배당) 가져오지 못했습니다." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="py-1 text-left font-normal">항목</th>
              <th className="py-1 text-right font-normal">{y ? `${y}년` : "당기"}</th>
              <th className="py-1 text-right font-normal">{y ? `${y - 1}년` : "전기"}</th>
              <th className="py-1 text-right font-normal">{y ? `${y - 2}년` : "전전기"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-t border-slate-100">
                <td className="py-2 pr-2 text-slate-600">{r.item}</td>
                <td className="py-2 text-right font-medium tabular-nums">{r.current}</td>
                <td className="py-2 text-right tabular-nums text-slate-500">{r.prev}</td>
                <td className="py-2 text-right tabular-nums text-slate-500">{r.prev2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

// ── 임원 ──────────────────────────────────────────────────────────
function OfficerCard({ bundle }: { bundle: CompanyBundle }) {
  const list = bundle.officers;
  return (
    <Card title="임원 현황">
      {list.length === 0 ? (
        <Empty text="임원 정보가 없거나 가져오지 못했습니다." />
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {list.map((o, i) => (
            <li key={o.name + i} className="flex items-center justify-between py-2">
              <span className="font-medium">{o.name}</span>
              <span className="text-right text-xs text-slate-500">
                {[o.position, o.registered, o.duty].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
