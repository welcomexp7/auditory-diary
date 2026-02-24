"use client";

import { motion } from "framer-motion";

interface MusitoryLogoProps {
  size?: number;
  className?: string;
}

/**
 * Musitory 로고 — 바이닐 그루브 + 펜촉이 결합된 엠블럼
 * Music(음악) + Story(이야기) = Musitory
 */
export const MusitoryLogo = ({ size = 80, className }: MusitoryLogoProps) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 외곽 원 (바이닐 테두리) */}
      <circle cx="60" cy="60" r="58" stroke="url(#logoGradient)" strokeWidth="2.5" fill="none" />

      {/* 바이닐 그루브 */}
      <circle cx="60" cy="60" r="48" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" fill="none" />
      <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" fill="none" />
      <circle cx="60" cy="60" r="32" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" fill="none" />

      {/* 중심 원 (라벨) */}
      <circle cx="60" cy="60" r="22" fill="url(#labelGradient)" />
      <circle cx="60" cy="60" r="3" fill="#111113" />

      {/* 음표 + 펜촉 결합 심볼 */}
      <g transform="translate(49, 46)">
        {/* 펜촉 (대각선 사선) */}
        <path
          d="M15 2 L18 26 L15 30 L12 26 Z"
          fill="rgba(255,255,255,0.9)"
          stroke="none"
        />
        {/* 음표 머리 */}
        <ellipse
          cx="10"
          cy="26"
          rx="6"
          ry="4.5"
          transform="rotate(-20, 10, 26)"
          fill="rgba(255,255,255,0.9)"
        />
        {/* 음표 기둥 연결 */}
        <rect x="14.5" y="4" width="1.5" height="20" fill="rgba(255,255,255,0.9)" rx="0.75" />
        {/* 깃발 */}
        <path
          d="M16 4 C20 6, 22 10, 18 14"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* 사운드 웨이브 (우측 상단 악센트) */}
      <g transform="translate(82, 22)" opacity="0.5">
        <path d="M0 8 Q3 0, 6 8 Q9 16, 12 8" stroke="url(#logoGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M4 8 Q6 3, 8 8" stroke="url(#logoGradient)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>

      <defs>
        <linearGradient id="logoGradient" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="labelGradient" x1="38" y1="38" x2="82" y2="82">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};
