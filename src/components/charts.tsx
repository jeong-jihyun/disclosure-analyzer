import { GRADE_STYLE } from "@/lib/score";
import type { Grade, ScoreParts } from "@/lib/types";

/** 반원 게이지 (0~100) */
export function ScoreGauge({ score, grade, small = false }: { score: number; grade: Grade; small?: boolean }) {
  const color = GRADE_STYLE[grade].hex;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className={`relative mx-auto ${small ? "w-36" : "w-56"}`}>
      <svg viewBox="0 0 200 115" className="w-full" role="img" aria-label={`안정성 점수 ${score}점, ${grade}`}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" pathLength={100} />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
          style={{ transition: "stroke-dasharray .4s, stroke .4s" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className={`${small ? "text-3xl" : "text-5xl"} font-bold leading-none tabular-nums`} style={{ color }}>
          {score}
        </div>
        <div className={`mt-1 font-semibold ${small ? "text-xs" : "text-sm"} ${GRADE_STYLE[grade].text}`}>{grade}</div>
      </div>
    </div>
  );
}

/** 4축 레이더 차트 */
export function Radar({ parts, color }: { parts: ScoreParts; color: string }) {
  const axes = [
    { label: "재무안정", v: parts.stability / 40 },
    { label: "수익성", v: parts.profit / 25 },
    { label: "공시", v: parts.disclosure / 20 },
    { label: "뉴스", v: parts.news / 15 },
  ];
  const cx = 100;
  const cy = 100;
  const R = 62;
  const pt = (i: number, ratio: number) => {
    const a = (-90 + i * 90) * (Math.PI / 180);
    return [cx + R * ratio * Math.cos(a), cy + R * ratio * Math.sin(a)] as const;
  };
  const poly = (ratio: number) => axes.map((_, i) => pt(i, ratio).join(",")).join(" ");
  const shape = axes.map((a, i) => pt(i, Math.max(0.04, a.v)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[220px]" role="img" aria-label="영역별 점수 레이더 차트">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={poly(r)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" />;
      })}
      <polygon points={shape} fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.24);
        return (
          <text key={a.label} x={x} y={y} fontSize="11" textAnchor="middle" dominantBaseline="middle" fill="#475569">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/** 영역별 막대 */
export function PartBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums">
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full"
          style={{ width: `${(value / max) * 100}%`, background: color, transition: "width .4s" }}
        />
      </div>
    </div>
  );
}
