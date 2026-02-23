import { motion } from "framer-motion";
import { useState } from "react";

/**
 * LP 바이닐 스큐어모피즘 애니메이션 컴포넌트
 * 의도(Why): 복잡한 애니메이션/스타일링 로직을 분리해 메인 페이지의 가독성을 높입니다.
 */
export const VinylRecord = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className="relative w-64 h-64 md:w-72 md:h-72 rounded-full flex items-center justify-center p-2 cursor-pointer z-20 group"
            style={{
                background: "linear-gradient(145deg, #18181b, #09090b)",
                boxShadow:
                    "20px 20px 60px #070708, -20px -20px 60px #1b1b1e, inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
            animate={isHovered ? { rotate: 360 } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* LP 홈 (Grooves) */}
            <div className="absolute inset-3 border-[0.5px] border-white/5 rounded-full" />
            <div className="absolute inset-5 border-[0.5px] border-white/5 rounded-full" />
            <div className="absolute inset-8 border-[0.5px] border-white/5 rounded-full" />
            <div className="absolute inset-12 border-[0.5px] border-white/5 rounded-full" />
            <div className="absolute inset-16 border-[0.5px] border-white/5 rounded-full" />
            <div className="absolute inset-20 border-[0.5px] border-white/5 rounded-full" />
            <div className="absolute inset-24 border-[0.5px] border-white/5 rounded-full" />

            {/* 중심 라벨 (Center Label) */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-800 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border-4 border-[#111]">
                <div className="text-xs font-bold text-white/80 tracking-widest text-center">
                    SIDE A<br />
                    <span className="text-[0.6rem] font-light">33 ⅓ RPM</span>
                </div>
                <div className="absolute w-4 h-4 rounded-full bg-[#111] border border-zinc-700 shadow-inner" />
            </div>

            {/* 빛 반사 효과 (Light reflection / glare) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent mix-blend-overlay pointer-events-none transform -rotate-45" />
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.1)_45deg,transparent_90deg,transparent_180deg,rgba(255,255,255,0.1)_225deg,transparent_270deg)] pointer-events-none opacity-50 transition-opacity group-hover:opacity-80" />

            {/* 톤암 힌트 (Tonearm Hint) */}
            <motion.div
                className="absolute -right-8 -top-8 w-16 h-40 origin-top-right opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={{ rotate: -20 }}
                animate={isHovered ? { rotate: 15 } : { rotate: -20 }}
            >
                <div className="w-2 h-32 bg-gradient-to-b from-zinc-300 to-zinc-500 rounded-full shadow-xl absolute right-8 top-4 origin-top rotate-12" />
                <div className="w-6 h-10 bg-zinc-800 rounded-sm shadow-xl absolute right-10 top-32 rotate-[25deg] border border-zinc-600" />
            </motion.div>
        </motion.div>
    );
};
