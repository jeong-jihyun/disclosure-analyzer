import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Disclosure Analysis - 공시 분석",
  description: "공시·재무·뉴스를 모아 기업의 위험도와 안정성을 한눈에 보고 시뮬레이션하는 모바일 사이트",
  applicationName: "Disclosure Analysis",
  appleWebApp: { capable: true, title: "Disclosure Analysis", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <div className="mx-auto min-h-dvh w-full max-w-md bg-slate-50 shadow-sm">{children}</div>
      </body>
    </html>
  );
}
