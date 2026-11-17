// 공시 분석(Disclosure Analysis) 로고: 연필로 체크(✓) 표시하는 모양
export const SITE_NAME = "Disclosure Analysis";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={SITE_NAME} className="shrink-0">
      <defs>
        <linearGradient id="da-rainbow" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.07" stopColor="#f97316" />
          <stop offset="0.14" stopColor="#eab308" />
          <stop offset="0.24" stopColor="#22c55e" />
          <stop offset="0.38" stopColor="#06b6d4" />
          <stop offset="0.52" stopColor="#38bdf8" />
          <stop offset="0.68" stopColor="#3b82f6" />
          <stop offset="0.85" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0f172a" />
      <path d="M12 35 L24 47 L40 27" fill="none" stroke="url(#da-rainbow)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(40 27) rotate(-45)">
        <path d="M0 0 L8 -4 L8 4 Z" fill="#fbbf24" />
        <path d="M0 0 L2.6 -1.3 L2.6 1.3 Z" fill="#0f172a" />
        <rect x="8" y="-4" width="15" height="8" fill="#38bdf8" />
        <rect x="23" y="-4" width="4" height="8" rx="1" fill="#f97316" />
      </g>
    </svg>
  );
}
