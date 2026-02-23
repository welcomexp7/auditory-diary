import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";

/**
 * 사용자 인증 훅
 * 의도(Why): 로그인 로직과 관련 상태 관리를 UI 컴포넌트에서 분리하여 재사용성과 가독성을 높입니다.
 */
export const useAuth = () => {
    const router = useRouter();

    // 이미 로그인된 사용자는 대시보드로 리다이렉트
    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (token) {
            router.replace("/dashboard");
        }
    }, [router]);

    // 구글 로그인 처리 로직
    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
                const res = await fetch(`${API_URL}/auth/google`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ access_token: tokenResponse.access_token }),
                });

                if (!res.ok) {
                    throw new Error("서버 인증 실패");
                }

                const data = await res.json();
                // 메모리나 불필요한 리렌더링 방지를 위해 곧바로 스토리지 저장 후 이동
                localStorage.setItem("access_token", data.access_token);
                router.push("/dashboard");
            } catch (error) {
                console.error("Backend Auth Error:", error);
                alert("로그인 처리 중 오류가 발생했습니다.");
            }
        },
        onError: () => {
            console.error("Login Failed");
            alert("구글 로그인에 실패했습니다.");
        },
    });

    return { loginWithGoogle };
};
