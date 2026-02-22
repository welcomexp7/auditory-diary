export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * 범용 API fetcher (인증 토큰 자동 삽입)
 */
export async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // 실제 구현에서는 zustand/context나 브라우저 쿠키/localStorage에서 JWT 추출
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // API 에러 처리
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "API 요청에 실패했습니다.");
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
