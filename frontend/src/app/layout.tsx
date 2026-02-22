import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Auditory Diary",
  description: "음악으로 기억을 되짚어보는 나만의 청각적 일기",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Auditory Diary",
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col items-center bg-[var(--color-background)]">
        {/* 모바일 뷰어와 유사한 폭으로 제한적인 컨테이너 적용 */}
        <div className="w-full max-w-md min-h-screen bg-[var(--color-surface)] shadow-2xl overflow-x-hidden relative">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
