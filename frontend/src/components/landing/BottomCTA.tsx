"use client";

import { motion } from "framer-motion";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { BackgroundBeams } from "@/components/ui/background-beams";

interface BottomCTAProps {
  onLogin: () => void;
}

export const BottomCTA = ({ onLogin }: BottomCTAProps) => {
  return (
    <section className="relative py-24 px-6 flex flex-col items-center text-center overflow-hidden">
      {/* BackgroundBeams */}
      <BackgroundBeams className="!bg-transparent opacity-20" />

      {/* 다층 에메랄드 글로우 */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-[120px]"
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-teal-400/10 rounded-full blur-[80px]"
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* 상단 구분선 */}
      <div className="absolute top-0 left-0 right-0">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>

      {/* 콘텐츠 */}
      <motion.div
        className="relative z-10 space-y-6 w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          className="inline-block text-xs font-medium tracking-[0.3em] uppercase text-emerald-500/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Get Started
        </motion.span>

        <h2 className="text-2xl font-bold text-slate-100">
          오늘의 음악,{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            내일의 기억
          </span>
        </h2>

        <p className="text-sm text-zinc-400 leading-relaxed max-w-[300px] mx-auto">
          지금 듣고 있는 음악이 미래의 당신에게 보내는 편지가 됩니다.
          <br />
          Musitory와 함께 시작하세요.
        </p>

        <div className="relative max-w-[320px] mx-auto pt-2">
          <div className="absolute -inset-2 bg-emerald-500/10 rounded-2xl blur-xl pointer-events-none animate-glow-pulse" />
          <GoogleLoginButton onClick={onLogin} variant="outline" />
        </div>
      </motion.div>

      {/* 푸터 */}
      <div className="relative z-10 mt-16 text-xs text-zinc-600">
        &copy; 2026 Musitory. All rights reserved.
      </div>
    </section>
  );
};
