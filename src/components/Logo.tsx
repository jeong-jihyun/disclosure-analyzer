// 공시 분석(Disclosure Analysis) 로고: 체크박스(☑) 모양
export const SITE_NAME = "Disclosure Analysis";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={SITE_NAME} className="shrink-0">
      <defs>
        <linearGradient id="da-rainbow" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22c55e" />
          <stop offset="0.35" stopColor="#14b8a6" />
          <stop offset="0.7" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0f172a" />
      <rect x="13" y="13" width="38" height="38" rx="9" fill="none" stroke="url(#da-rainbow)" strokeWidth="5" />
      <path d="M23 33 L30 40 L42 25" fill="none" stroke="url(#da-rainbow)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
