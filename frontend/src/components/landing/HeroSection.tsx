"use client";

import { motion, type Variants } from "framer-motion";
import { MusitoryLogo } from "./MusitoryLogo";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Meteors } from "@/components/ui/meteors";

/* ── 플로팅 파티클 ── */
const particles = [
  { x: "10%", y: "15%", size: 3, delay: 0, duration: 6 },
  { x: "85%", y: "20%", size: 2, delay: 1.5, duration: 7 },
  { x: "20%", y: "70%", size: 2.5, delay: 0.8, duration: 5.5 },
  { x: "75%", y: "65%", size: 2, delay: 2, duration: 8 },
  { x: "50%", y: "85%", size: 3, delay: 0.5, duration: 6.5 },
  { x: "30%", y: "40%", size: 1.5, delay: 3, duration: 7.5 },
  { x: "65%", y: "30%", size: 2, delay: 1, duration: 6 },
  { x: "90%", y: "80%", size: 1.5, delay: 2.5, duration: 5 },
  { x: "15%", y: "50%", size: 2, delay: 1.2, duration: 6.8 },
  { x: "45%", y: "25%", size: 1.8, delay: 0.3, duration: 7.2 },
];

/* ── 애니메이션 Variants ── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── 단어별 등장 효과용 Variants ── */
const wordContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface HeroSectionProps {
  onLogin: () => void;
}

export const HeroSection = ({ onLogin }: HeroSectionProps) => {
  const words = "Spotify 청취 기록과 AI가 만드는 당신만의 청각적 일기장".split(" ");

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* ── 0층: BackgroundBeams (그리드 + 빔) ── */}
      <BackgroundBeams className="!bg-transparent opacity-30" />

      {/* ── 1층: 에메랄드 오로라 글로우 ── */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[50%] rounded-full bg-emerald-500/20 blur-[120px]"
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[10%] -right-[15%] w-[60%] h-[45%] rounded-full bg-teal-500/15 blur-[100px]"
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-[35%] left-[20%] w-[40%] h-[30%] rounded-full bg-cyan-500/10 blur-[80px]"
          animate={{ opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* ── 2층: 노이즈 텍스처 ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── 3층: 유성 효과 ── */}
      <Meteors number={8} className="opacity-60" />

      {/* ── 4층: 플로팅 파티클 ── */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-emerald-400/30"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ── 5층: 바이닐 그루브 링 ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] pointer-events-none">
        <motion.div
          className="w-[500px] h-[500px] rounded-full border border-white/[0.03]"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-8 rounded-full border border-white/[0.03]"
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-20 rounded-full border border-emerald-500/[0.05]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 로고 + 글로우 */}
        <motion.div className="relative mb-6" variants={itemVariants}>
          <div className="absolute -inset-8 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -inset-4 bg-teal-500/10 rounded-full blur-xl pointer-events-none animate-glow-pulse" />
          <MusitoryLogo size={96} />
        </motion.div>

        {/* 시머 브랜드명 */}
        <motion.h1 variants={itemVariants}>
          <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-[linear-gradient(90deg,#34d399,#5eead4,#ffffff,#5eead4,#34d399)] bg-[length:200%_auto] animate-shimmer">
            Musitory
          </span>
        </motion.h1>

        {/* 서브 헤드라인 */}
        <motion.p
          className="mt-2 text-xs font-medium tracking-[0.25em] uppercase text-emerald-500/60"
          variants={itemVariants}
        >
          Music + Story
        </motion.p>

        {/* 구분선 (그래디언트 + 글로우) */}
        <motion.div className="relative mt-6 mb-6" variants={itemVariants}>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <div className="absolute inset-0 w-16 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent blur-sm" />
        </motion.div>

        {/* 메인 카피 */}
        <motion.div className="space-y-3 max-w-[300px]" variants={itemVariants}>
          <p className="text-lg font-medium text-slate-200 leading-snug">
            오늘 들은 노래가
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-300">
              내일의 일기
            </span>
            가 됩니다
          </p>
          {/* 단어별 등장 효과 */}
          <motion.p
            className="text-sm text-zinc-500 leading-relaxed"
            variants={wordContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {words.map((word, i) => (
              <motion.span key={i} variants={wordVariants} className="inline-block mr-[0.3em]">
                {word}
              </motion.span>
            ))}
          </motion.p>
        </motion.div>

        {/* CTA 버튼 (글로우 효과 추가) */}
        <motion.div className="w-full max-w-[300px] mt-10 relative" variants={itemVariants}>
          <div className="absolute -inset-2 bg-emerald-500/10 rounded-2xl blur-xl pointer-events-none animate-glow-pulse" />
          <GoogleLoginButton onClick={onLogin} />
          <p className="mt-3 text-[11px] text-zinc-600 text-center">
            무료로 시작 · 가입 절차 없음
          </p>
        </motion.div>
      </motion.div>

      {/* 스크롤 힌트 */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="text-[10px] text-zinc-600 tracking-wider uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            className="w-4 h-4 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
};
