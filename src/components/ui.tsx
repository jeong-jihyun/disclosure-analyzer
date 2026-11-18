import type { ReactNode } from "react";
import type { RiskTag, Sentiment } from "@/lib/types";

export function Card({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

const SEV_STYLE = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-amber-100 text-amber-800",
  3: "bg-rose-100 text-rose-700",
} as const;

export function RiskChip({ tag }: { tag: RiskTag }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${SEV_STYLE[tag.severity]}`}>
      {tag.severity === 3 ? "⚠ " : ""}
      {tag.label}
    </span>
  );
}

const SENT = {
  pos: { text: "긍정", cls: "bg-emerald-100 text-emerald-700" },
  neg: { text: "부정", cls: "bg-rose-100 text-rose-700" },
  neu: { text: "중립", cls: "bg-slate-100 text-slate-600" },
} as const;

export function SentimentChip({ s }: { s: Sentiment }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${SENT[s].cls}`}>
      {SENT[s].text}
    </span>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  const cls = tone === "warn" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-sky-50 text-sky-800 ring-sky-200";
  return <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ring-1 ${cls}`}>{children}</div>;
}

export function Disclaimer() {
  return (
    <p className="px-4 pb-4 pt-2 text-center text-[11px] leading-relaxed text-slate-400">
      참고용 정보이며 투자 권유가 아닙니다. 점수는 공시·재무·뉴스 제목을 단순 규칙으로 계산한 값이라 실제 위험과 다를 수 있습니다.
    </p>
  );
}

/** 관련 법령 링크 (국가법령정보센터로 이동) */
export function LawLinks({ laws }: { laws: { text: string; url: string }[] }) {
  if (laws.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
      <span className="text-slate-400">관련 법령</span>
      {laws.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700 active:bg-sky-100"
        >
          {l.text}
        </a>
      ))}
    </div>
  );
}
