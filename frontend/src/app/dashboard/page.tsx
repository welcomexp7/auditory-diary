import { Suspense } from "react";
import Dashboard from "./DashboardClient";

// 프리렌더링 비활성화 — localStorage, useSearchParams 등 브라우저 API 사용 페이지
export const dynamic = "force-dynamic";

// Next.js 16: useSearchParams()를 쓰는 클라이언트 컴포넌트는 Suspense로 감싸야 프리렌더 에러 방지
export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-slate-900 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </main>
            }
        >
            <Dashboard />
        </Suspense>
    );
}
