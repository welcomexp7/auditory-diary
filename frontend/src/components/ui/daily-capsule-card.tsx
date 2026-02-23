"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";

interface DailyCapsuleCardProps {
    dateStr: string;
    aiSummary: string;
    representativeImageUrl: string | null;
}

export default function DailyCapsuleCard({ dateStr, aiSummary, representativeImageUrl }: DailyCapsuleCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Spotify CDN 이미지를 백엔드 프록시를 경유하여 CORS 없이 로드 (html2canvas 호환성 확보)
    const getProxiedImageUrl = (url: string | null) => {
        if (!url) return null;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
        return `${API_URL}/capsules/image-proxy?url=${encodeURIComponent(url)}`;
    };

    const proxiedImage = getProxiedImageUrl(representativeImageUrl);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            setIsDownloading(true);
            const canvas = await html2canvas(cardRef.current, {
                useCORS: true,
                allowTaint: false,
                backgroundColor: "#0d0d0f",
                scale: 2
            });

            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `my-auditory-capsule-${dateStr}.png`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error("캡슐 캡처 실패:", error);
            alert("이미지 저장에 실패했습니다. (CORS 문제일 수 있습니다)");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-full max-w-sm mx-auto mb-12 flex flex-col gap-4 relative z-20"
        >
            {/* Downloadable Area (9:16 aspect ratio approximation for IG Story) */}
            <div
                ref={cardRef}
                className="relative w-full aspect-[9/16] rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center p-8 bg-[#111113] border border-white/10"
                style={{
                    boxShadow: "0 20px 50px -10px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)"
                }}
            >
                {/* Background Image with heavy blur */}
                {proxiedImage && (
                    <div
                        className="absolute inset-0 z-0 opacity-40 mix-blend-screen overflow-hidden pointer-events-none"
                    >
                        <img
                            src={proxiedImage}
                            alt="Background Blur"
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover blur-3xl scale-125 saturate-150"
                        />
                    </div>
                )}

                {/* Inner Content */}
                <div className="relative z-10 flex flex-col items-center h-full w-full justify-between">
                    <div className="text-center pt-8">
                        <p className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em] mb-2 font-bold drop-shadow-md">
                            Auditory Diary
                        </p>
                        <p className="text-zinc-300 font-medium text-sm tracking-wider">
                            {new Date(dateStr).toLocaleDateString('ko-KR', {
                                year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul'
                            })}
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center w-full gap-8">
                        {/* Vinyl Record Metaaphor Main Art */}
                        <motion.div
                            initial={{ rotate: -10, y: 10 }}
                            animate={{ rotate: 0, y: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)] border-4 border-zinc-900 overflow-hidden"
                        >
                            {proxiedImage ? (
                                <img
                                    src={proxiedImage}
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover animate-[spin_20s_linear_infinite]"
                                    style={{ animationPlayState: 'running' }}
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 animate-[spin_20s_linear_infinite]" />
                            )}
                            <div className="absolute inset-0 rounded-full border border-white/10" />
                            {/* Center Hole */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-900 border border-zinc-800" />
                        </motion.div>

                        <div className="w-full flex-col flex items-center bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
                            <span className="text-3xl mb-3 block opacity-80 animate-pulse">✨</span>
                            <p className="text-white text-base sm:text-lg font-medium leading-relaxed text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                "{aiSummary}"
                            </p>
                        </div>
                    </div>

                    <div className="pb-4 w-full text-center">
                        <div className="mx-auto w-12 h-1 rounded-full bg-white/20" />
                    </div>
                </div>
            </div>

            {/* Interaction Button (Not captured) */}
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="mx-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 disabled:opacity-50 border border-white/5 shadow-lg"
            >
                {isDownloading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        저장 중...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        스토리 저장하기
                    </>
                )}
            </button>
        </motion.div>
    );
}
