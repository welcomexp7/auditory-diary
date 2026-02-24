"use client";

import { motion } from "framer-motion";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { testimonialsData } from "@/constants/landing-data";

export const TestimonialsSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* 배경 글로우 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute top-1/3 -left-[20%] w-[60%] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 -right-[20%] w-[60%] h-[200px] bg-teal-500/5 rounded-full blur-[80px]" />
      </div>

      {/* 섹션 헤더 */}
      <motion.div
        className="text-center mb-10 px-6 relative z-10"
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
          Testimonials
        </motion.span>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">
          사용자 후기
        </h2>
        <p className="text-sm text-zinc-500">
          Musitory를 경험한 분들의 이야기
        </p>
      </motion.div>

      {/* InfiniteMovingCards */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <InfiniteMovingCards
          items={testimonialsData}
          direction="left"
          speed="slow"
          className="max-w-full"
        />
      </motion.div>
    </section>
  );
};
