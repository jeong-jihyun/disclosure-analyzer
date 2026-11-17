// 공시 분석(Disclosure Analysis) 로고: 무지개 링 레이더 + 반짝이는 신호점
export const SITE_NAME = "Disclosure Analysis";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={SITE_NAME} className="shrink-0">
      <defs>
        <linearGradient id="da-rainbow" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.2" stopColor="#f97316" />
          <stop offset="0.4" stopColor="#eab308" />
          <stop offset="0.6" stopColor="#22c55e" />
          <stop offset="0.8" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0f172a" />
      <circle cx="32" cy="33" r="21" fill="none" stroke="url(#da-rainbow)" strokeWidth="5" />
      <circle cx="32" cy="33" r="11" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M32 33 L47 18" stroke="url(#da-rainbow)" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="33" r="3" fill="#fff" />
      <circle cx="47" cy="18" r="4.5" fill="#fff" />
    </svg>
  );
}
