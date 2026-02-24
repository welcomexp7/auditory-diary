"use client";

import { motion } from "framer-motion";
import { scrollContentsData } from "@/constants/landing-data";

export const HowItWorksSection = () => {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* 배경 글로우 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      {/* 섹션 헤더 */}
      <motion.div
        className="text-center mb-14 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.span
          className="inline-block text-xs font-medium tracking-[0.3em] uppercase text-emerald-500/70 mb-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          How it Works
        </motion.span>
        <h2 className="text-2xl font-bold text-slate-100">
          시작하는 방법
        </h2>
      </motion.div>

      {/* 타임라인 */}
      <div className="relative z-10">
        {scrollContentsData.map((step, index) => {
          const isLast = index === scrollContentsData.length - 1;
          return (
            <div key={step.title} className="relative flex gap-5">
              {/* 타임라인 (번호 원 + 글로우 연결선) */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative z-10 flex-shrink-0"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: [0, 1.2, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {/* 노드 글로우 */}
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-glow-pulse" />
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                    {index + 1}
                  </div>
                </motion.div>
                {!isLast && (
                  <motion.div
                    className="w-px flex-1 mt-3 bg-gradient-to-b from-emerald-500/40 via-emerald-500/20 to-transparent"
                    initial={{ scaleY: 0, originY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                  />
                )}
              </div>

              {/* 콘텐츠 카드 (글래스모피즘) */}
              <motion.div
                className="flex-1 pb-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.1 }}
              >
                <div className="group p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] transition-all duration-300 hover:border-emerald-500/15 hover:bg-white/[0.05]">
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                    {step.description}
                  </p>
                  {/* 그래디언트 비주얼 블록 */}
                  <div className="h-28 w-full rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 group-hover:ring-emerald-500/10 transition-all duration-300">
                    {step.content}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
