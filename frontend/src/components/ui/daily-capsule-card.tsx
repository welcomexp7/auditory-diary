"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DailyCapsuleCardProps {
    dateStr: string;
    aiSummary: string;
    representativeImageUrl: string | null;
    theme?: ThemeMode; // Backend-provided auto-inferred theme
}

type ThemeMode = "aura" | "editorial" | "y2k" | "midnight";

const THEMES: Record<ThemeMode, any> = {
    aura: {
        id: "aura",
        label: "Aura",
        container: "bg-[#0b0b0b] text-white",
        meshBlur: "mix-blend-screen opacity-60 saturate-150 blur-[80px]",
        cardBg: "bg-black/30 backdrop-blur-3xl border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
        date: "font-sans text-xs tracking-[0.2em] text-white/50 uppercase",
        quoteIcon: "font-serif text-3xl text-white/30",
        quote: "font-sans text-[17px] leading-relaxed tracking-tight text-white/95 font-medium",
        sleeveBorder: "border-white/10 shadow-2xl",
        spinVinyl: true,
        vinylFilter: "brightness-90",
    },
    editorial: {
        id: "editorial",
        label: "Editorial",
        container: "bg-[#f5f3ef] text-[#1c1a17]",
        meshBlur: "mix-blend-multiply opacity-30 saturate-50 blur-[80px]",
        cardBg: "bg-[#f5f3ef]/80 backdrop-blur-2xl border-[#1c1a17]/10 shadow-xl",
        date: "font-serif text-[11px] tracking-widest text-[#1c1a17]/50 uppercase",
        quoteIcon: "font-serif text-4xl text-[#1c1a17]/20 italic",
        quote: "font-serif text-[19px] leading-relaxed tracking-tight text-[#1c1a17] italic",
        sleeveBorder: "border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]",
        spinVinyl: false,
        vinylFilter: "sepia-0",
    },
    y2k: {
        id: "y2k",
        label: "Y2K",
        container: "bg-[#11111b] text-white",
        meshBlur: "mix-blend-color-dodge opacity-80 saturate-[3] hue-rotate-[180deg] blur-[60px]",
        cardBg: "bg-gradient-to-br from-indigo-900/40 to-fuchsia-900/40 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_-10px_rgba(217,70,239,0.3)]",
        date: "font-mono text-[10px] tracking-[0.3em] text-fuchsia-300 uppercase",
        quoteIcon: "font-mono text-3xl text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
        quote: "font-mono text-[15px] leading-loose tracking-tighter text-white drop-shadow-sm",
        sleeveBorder: "border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.4)]",
        spinVinyl: true,
        vinylFilter: "contrast-125 saturate-150",
    },
    midnight: {
        id: "midnight",
        label: "Midnight",
        container: "bg-[#050505] text-[#d4d4d8]",
        meshBlur: "mix-blend-overlay opacity-50 saturate-0 blur-[100px]",
        cardBg: "bg-[#0f0f11]/80 backdrop-blur-md border border-white/5 shadow-2xl rounded-sm",
        date: "font-mono text-xs tracking-wider text-zinc-500",
        quoteIcon: "font-serif text-3xl text-zinc-700",
        quote: "font-sans text-[16px] leading-[1.8] tracking-tight text-zinc-300 font-light",
        sleeveBorder: "border-zinc-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)]",
        spinVinyl: false,
        vinylFilter: "grayscale-[0.8] contrast-125",
    },
};

export default function DailyCapsuleCard({ dateStr, aiSummary, representativeImageUrl, theme: initialTheme = "aura" }: DailyCapsuleCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeTheme, setActiveTheme] = useState<ThemeMode>(initialTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const getProxiedImageUrl = (url: string | null) => {
        if (!url) return null;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
        return `${API_URL}/capsules/image-proxy?url=${encodeURIComponent(url)}`;
    };

    const proxiedImage = getProxiedImageUrl(representativeImageUrl);
    const theme = THEMES[activeTheme];

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            setIsDownloading(true);
            await new Promise((resolve) => setTimeout(resolve, 150)); // Allow vinyl to settle at 0deg

            const domtoimage = (await import('dom-to-image')).default;
            const element = cardRef.current;

            // Fix text rendering by waiting for fonts and forcing specific scale
            const dataUrl = await domtoimage.toPng(element, {
                quality: 1.0,
                style: {
                    transform: 'scale(3)', // High-res export
                    transformOrigin: 'top left',
                    width: element.offsetWidth + 'px',
                    height: element.offsetHeight + 'px'
                },
                width: element.offsetWidth * 3,
                height: element.offsetHeight * 3
            });

            const link = document.createElement("a");
            link.download = `diary-${dateStr}-${activeTheme}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("캡처 실패:", error);
            alert("이미지 저장 실패. 최신 브라우저를 확인해주세요.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="w-full flex-col items-center max-w-[340px] mx-auto mb-16 relative z-20">
            {/* Minimalist Theme Switcher */}
            <div className="flex gap-1.5 justify-center mb-6">
                {(Object.values(THEMES)).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTheme(t.id as ThemeMode)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${activeTheme === t.id
                            ? "bg-white text-black shadow-md border border-black/10"
                            : "bg-black/20 text-white/60 border-white/5 hover:bg-black/40 hover:text-white"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTheme}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full relative"
            >
                {/* 9:16 Canvas Area */}
                <div
                    ref={cardRef}
                    className={`relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col justify-between p-7 mx-auto transition-colors duration-700 ${theme.container}`}
                    style={{
                        // Add subtle inner stroke for premium feel across themes
                        boxShadow: activeTheme === "editorial" ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.05)"
                    }}
                >
                    {/* Deep Mesh Gradient Background */}
                    {proxiedImage && (
                        <div className={`absolute inset-0 z-0 scale-150 transform transition-all duration-1000 ${theme.meshBlur}`}>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
                            <img
                                src={proxiedImage}
                                alt="gradient blur"
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Noise Overlay */}
                    <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

                    {/* Vibe Overlays */}
                    {activeTheme === "y2k" && (
                        <div className="absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none" />
                    )}

                    {/* Top Content: Date & Heading */}
                    <div className="relative z-10 w-full flex justify-between items-start pt-2">
                        <div className="flex flex-col gap-1">
                            <span className={theme.date}>Auditory Diary</span>
                            <span className={`${theme.date} text-opacity-100 font-bold opacity-80`}>
                                {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        {/* Motif icon / Logo placeholder */}
                        <div className="w-2 h-2 rounded-full bg-current opacity-30 mt-1" />
                    </div>

                    {/* Center Content: The Sleeve & Record Layout */}
                    <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center -mt-4">
                        <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                            {/* The Vinyl Record (Sliding out to the right) */}
                            <motion.div
                                initial={{ x: 0, rotate: 0 }}
                                animate={{
                                    x: 24, // Peeking out
                                    rotate: isDownloading ? 0 : (theme.spinVinyl ? 360 : 15)
                                }}
                                transition={{
                                    x: { duration: 1, delay: 0.3, type: "spring", stiffness: 50 },
                                    rotate: isDownloading ? { duration: 0 } : (theme.spinVinyl ? { duration: 25, ease: "linear", repeat: Infinity } : { duration: 1, delay: 0.3 })
                                }}
                                className={`absolute top-2 bottom-2 right-0 w-44 sm:w-48 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center ${theme.vinylFilter}`}
                                style={{ transformOrigin: "center" }}
                            >
                                {/* Inner grooves effect */}
                                <div className="absolute inset-1 rounded-full border border-white/[0.03] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]" />
                                <div className="absolute inset-3 rounded-full border border-white/[0.02]" />
                                <div className="absolute inset-5 rounded-full border border-white/[0.02]" />

                                {/* Label area */}
                                {proxiedImage && (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#111] overflow-hidden relative">
                                        <img src={proxiedImage} alt="label" crossOrigin="anonymous" className="w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 rounded-full border border-black/20" />
                                        {/* Center spindle hole */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#111] border border-black/50" />
                                    </div>
                                )}
                            </motion.div>

                            {/* The Album Sleeve (Front Cover) */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                                className={`absolute inset-0 bg-neutral-800 rounded-sm overflow-hidden z-10 border ${theme.sleeveBorder}`}
                                style={{ borderRight: "none" }} // Simulate open sleeve
                            >
                                {proxiedImage && (
                                    <img
                                        src={proxiedImage}
                                        alt="Album Art"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {/* Sleeve physical lighting effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
                                <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Bottom Content: The AI Quote */}
                    <div className="relative z-10 w-full mt-4">
                        <div className={`p-5 rounded-xl transition-all duration-500 ${theme.cardBg}`}>
                            <div className={`${theme.quoteIcon} mb-1 leading-none`}>&ldquo;</div>
                            <p className={`${theme.quote} break-keep`}>
                                {aiSummary}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Share Action */}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="mx-auto mt-6 flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl border border-black/10"
                >
                    {isDownloading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Rendering High-Res...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v8m0 0l-4-4m4 4l4-4m4-5e1a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Save for Instagram
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
