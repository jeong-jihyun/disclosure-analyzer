"use client";

import { useMemo, useState } from "react";
import { applyShock, computeScore, GRADE_STYLE } from "@/lib/score";
import type { CompanyBundle, Shock } from "@/lib/types";
import { ScoreGauge } from "./charts";
import { Card } from "./ui";

const PRESETS: { name: string; shock: Shock }[] = [
  { name: "경기침체", shock: { revenueChange: -0.25, debtChange: 0.1, rateUp: 0 } },
  { name: "금리충격", shock: { revenueChange: -0.05, debtChange: 0, rateUp: 0.03 } },
  { name: "부채위기", shock: { revenueChange: -0.15, debtChange: 0.5, rateUp: 0.02 } },
  { name: "호황", shock: { revenueChange: 0.15, debtChange: -0.0, rateUp: 0 } },
];

const ZERO: Shock = { revenueChange: 0, debtChange: 0, rateUp: 0 };

export function Simulator({ bundle }: { bundle: CompanyBundle }) {
  const [shock, setShock] = useState<Shock>(ZERO);

  const base = useMemo(
    () => computeScore(bundle.financials, bundle.disclosures, bundle.news),
    [bundle],
  );
  const after = useMemo(() => {
    if (!bundle.financials) return null;
    return computeScore(applyShock(bundle.financials, shock), bundle.disclosures, bundle.news);
  }, [bundle, shock]);

  if (!base || !after) {
    return <p className="p-4 text-sm text-slate-500">재무제표가 있어야 시뮬레이션을 할 수 있습니다.</p>;
  }

  const diff = after.total - base.total;
  const rows: { label: string; b: number; a: number; unit: string; goodHigh: boolean }[] = [
    { label: "부채비율", b: base.metrics.debtRatio, a: after.metrics.debtRatio, unit: "%", goodHigh: false },
    { label: "유동비율", b: base.metrics.currentRatio, a: after.metrics.currentRatio, unit: "%", goodHigh: true },
    { label: "영업이익률", b: base.metrics.opMargin, a: after.metrics.opMargin, unit: "%", goodHigh: true },
    { label: "이자보상배율", b: base.metrics.interestCover, a: after.metrics.interestCover, unit: "배", goodHigh: true },
  ];

  return (
    <div className="space-y-3">
      <Card title="시나리오 고르기">
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setShock(p.shock)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 active:bg-slate-200"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setShock(ZERO)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200"
          >
            처음으로
          </button>
        </div>

        <Slider
          label="매출 변화"
          value={shock.revenueChange}
          min={-0.5}
          max={0.2}
          step={0.01}
          fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
          onChange={(v) => setShock({ ...shock, revenueChange: v })}
        />
        <Slider
          label="부채 증가"
          value={shock.debtChange}
          min={-0.3}
          max={1}
          step={0.01}
          fmt={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
          onChange={(v) => setShock({ ...shock, debtChange: v })}
        />
        <Slider
          label="금리 상승"
          value={shock.rateUp}
          min={0}
          max={0.05}
          step={0.001}
          fmt={(v) => `+${(v * 100).toFixed(1)}%p`}
          onChange={(v) => setShock({ ...shock, rateUp: v })}
        />
      </Card>

      <Card title="결과 비교">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="mb-1 text-xs text-slate-500">지금</p>
            <ScoreGauge score={base.total} grade={base.grade} small />
          </div>
          <div className="text-xl text-slate-300">→</div>
          <div className="text-center">
            <p className="mb-1 text-xs text-slate-500">가정 후</p>
            <ScoreGauge score={after.total} grade={after.grade} small />
          </div>
        </div>
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-center text-sm font-semibold ${GRADE_STYLE[after.grade].bg} ${GRADE_STYLE[after.grade].text}`}
        >
          {diff === 0
            ? "점수 변화 없음"
            : diff < 0
              ? `점수가 ${Math.abs(diff)}점 내려가 '${after.grade}' 등급이 됩니다`
              : `점수가 ${diff}점 올라 '${after.grade}' 등급이 됩니다`}
          {base.grade !== after.grade && diff < 0 && " ⚠"}
        </p>

        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400">
              <th className="py-1 text-left font-normal">지표</th>
              <th className="py-1 text-right font-normal">지금</th>
              <th className="py-1 text-right font-normal">가정 후</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const worse = r.goodHigh ? r.a < r.b - 0.05 : r.a > r.b + 0.05;
              const better = r.goodHigh ? r.a > r.b + 0.05 : r.a < r.b - 0.05;
              return (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="py-2 text-slate-600">{r.label}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(r.b, r.unit)}{r.unit}</td>
                  <td
                    className={`py-2 text-right font-medium tabular-nums ${worse ? "text-rose-600" : better ? "text-emerald-600" : ""}`}
                  >
                    {fmt(r.a, r.unit)}{r.unit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <p className="px-1 text-[11px] leading-relaxed text-slate-400">
        계산 가정: 매출이 바뀌면 영업이익은 그 변화액의 40%만큼 함께 변합니다. 부채가 늘면 유동부채와 이자비용도 같은 비율로 늘고,
        이자를 내는 부채는 총부채의 절반으로 봅니다. 공시·뉴스 점수는 그대로입니다.
      </p>
    </div>
  );
}

const fmt = (n: number, unit: string) =>
  unit === "배" ? (n >= 99 ? "99+" : n.toFixed(1)) : n >= 999 ? "999+" : n <= -999 ? "-999" : n.toFixed(1);

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-2 block">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{props.label}</span>
        <span className="font-semibold tabular-nums">{props.fmt(props.value)}</span>
      </div>
      <input
        type="range"
        className="w-full"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}
