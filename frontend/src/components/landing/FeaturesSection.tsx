"use client";

import { motion } from "framer-motion";
import { featuresData } from "@/constants/landing-data";
import { Meteors } from "@/components/ui/meteors";

export const FeaturesSection = () => {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* 배경: 유성 효과 */}
      <Meteors number={10} className="opacity-40" />

      {/* 섹션 구분선 (글로우 효과) */}
      <div className="relative mb-16">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent blur-sm" />
      </div>

      {/* 섹션 헤더 */}
      <motion.div
        className="text-center mb-12"
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
          Features
        </motion.span>
        <h2 className="text-2xl font-bold text-slate-100">
          왜{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Musitory
          </span>
          인가요?
        </h2>
      </motion.div>

      {/* 피처 카드 목록 (글래스모피즘) */}
      <div className="space-y-4">
        {featuresData.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.12 }}
          >
            {/* 카드 본체 */}
            <div className="relative p-5 bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl transition-all duration-300 group-hover:border-emerald-500/20 group-hover:bg-white/[0.05]">
              {/* 상단 악센트 라인 (hover 시 표시) */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-start gap-4">
                {/* 아이콘 (글로우 효과) */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <div className="scale-125">{feature.icon}</div>
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-100 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
