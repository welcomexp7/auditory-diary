"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // 이미 로그인된 상태면 자동으로 대시보드로 리다이렉트 (뒤로가기 방지)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log("Google Token:", tokenResponse);

        // 백엔드로 Google Access Token 전송하여 우리 서비스 JWT 발급받기
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
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

        // 발급받은 JWT를 로컬스토리지에 저장 (실제 서비스에선 HttpOnly 쿠키 권장)
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-gray-900 via-slate-900 to-black">

      {/* 백그라운드 애니메이션 효과 */}
      <motion.div
        className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-30"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-20"
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      <div className="z-10 flex flex-col items-center justify-center space-y-12 text-center w-full max-w-sm">

        {/* 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Auditory<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              Diary
            </span>
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            음악으로 기억하는 나만의 감성 공간
          </p>
        </motion.div>

        {/* 재생 아이콘 애니메이션 */}
        <motion.div
          className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-800/50 backdrop-blur-md border border-slate-700 shadow-2xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center"
            animate={isHovered ? { scale: [1, 1.1, 1], rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-2" />
          </motion.div>
        </motion.div>

        {/* 로그인 링크 & 둘러보기 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="w-full pt-8 space-y-4"
        >
          <button
            onClick={() => handleGoogleLogin()}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-gray-900 shadow-xl transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <Link
            href="/dashboard"
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-800/80 backdrop-blur-sm px-6 py-4 text-sm font-semibold text-slate-300 shadow-xl transition-all hover:bg-slate-700 hover:text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            둘러보기 (Guest Mode)
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
