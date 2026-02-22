import Dashboard from "./DashboardClient";

// 프리렌더링 비활성화 — localStorage 등 브라우저 API 사용 페이지
export const dynamic = "force-dynamic";

export default function DashboardPage() {
    return <Dashboard />;
}
