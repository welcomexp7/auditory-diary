"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SpotifyCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("스포티파이 연동 처리 중...");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            const error = searchParams.get("error");

            if (error) {
                setStatus(`연동 실패: ${error}`);
                setTimeout(() => router.push("/dashboard"), 3000);
                return;
            }

            if (!code || !state) {
                setStatus("인증 정보가 부족합니다. 대시보드로 돌아갑니다.");
                setTimeout(() => router.push("/dashboard"), 2000);
                return;
            }

            try {
                // Spotify OAuth 콜백에서 받은 code와 state(user_id)를
                // 백엔드 GET 콜백 엔드포인트로 그대로 전달하여 토큰 교환 처리
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
                const callbackUrl = `${API_URL}/auth/spotify/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

                const res = await fetch(callbackUrl, {
                    redirect: "manual",
                });

                // 백엔드가 RedirectResponse(302)를 반환 → manual 모드에서 opaqueredirect로 처리됨
                if (res.type === "opaqueredirect" || res.ok || res.status === 302) {
                    setStatus("스포티파이 연동이 완료되었습니다! 대시보드로 이동합니다.");
                    setTimeout(() => router.push("/dashboard?spotify=connected"), 1500);
                } else {
                    throw new Error("서버에서 연동 처리에 실패했습니다.");
                }

            } catch (err: any) {
                console.error(err);
                setStatus(`오류 발생: ${err.message}`);
                setTimeout(() => router.push("/dashboard"), 3000);
            }
        };

        handleCallback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#1DB954] flex items-center justify-center mx-auto animate-pulse">
                    <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                    Spotify Connecting
                </h2>
                <p className="text-sm text-slate-400">{status}</p>
            </div>
        </main>
    );
}

export default function SpotifyCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SpotifyCallbackContent />
        </Suspense>
    );
}
