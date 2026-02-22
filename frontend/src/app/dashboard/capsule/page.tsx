"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

export default function TimeCapsuleView() {
    const [isPlaying, setIsPlaying] = useState(false);

    // 목업 데이터 (단일 회상)
    const memory = {
        track: {
            title: "Hype Boy",
            artist: "NewJeans",
            album_artwork_url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80"
        },
        context: {
            place_name: "강남역 11번 출구",
            weather: "Clouds"
        },
        listened_at: "2024-05-11T14:15:00Z"
    };

    const date = new Date(memory.listened_at);

    return (
        <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden">

            {/* 몽환적인 백그라운드 효과 (현재 재생 상태에 따라 애니메이션 변경) */}
            <motion.div
                className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900"
                animate={{
                    background: isPlaying
                        ? ["linear-gradient(to bottom right, rgba(49, 46, 129, 0.4), rgba(88, 28, 135, 0.4))", "linear-gradient(to bottom right, rgba(131, 24, 67, 0.4), rgba(49, 46, 129, 0.4))"]
                        : "linear-gradient(to bottom right, rgba(15, 23, 42, 1), rgba(15, 23, 42, 1))"
                }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            />

            {/* 닫기 버튼 */}
            <div className="z-10 flex justify-between items-center pt-4">
                <Link href="/dashboard" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </Link>
                <span className="text-sm tracking-widest text-slate-400 font-medium">MEMORY</span>
                <div className="w-10" /> {/* 우측 여백 맞춤용 */}
            </div>

            {/* 중앙 아트워크 및 타이틀 */}
            <div className="z-10 flex flex-col items-center justify-center flex-1 space-y-8">
                <motion.div
                    className="relative"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                >
                    {/* 재생 시 외곽선 Glow 효과 */}
                    <motion.div
                        className="absolute -inset-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 blur-xl"
                        animate={{ opacity: isPlaying ? 0.4 : 0, scale: isPlaying ? [1, 1.1, 1] : 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    <img
                        src={memory.track.album_artwork_url}
                        alt="Album Art"
                        className={`w-64 h-64 rounded-xl object-cover shadow-2xl transition-transform duration-1000 ${isPlaying ? 'scale-105' : ''}`}
                    />
                </motion.div>

                <motion.div
                    className="text-center space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">{memory.track.title}</h1>
                    <p className="text-lg text-slate-300">{memory.track.artist}</p>
                </motion.div>
            </div>

            {/* 하단 메타데이터 및 재생 컨트롤 */}
            <motion.div
                className="z-10 bg-slate-800/60 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-slate-700 shadow-2xl space-y-6"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {/* 장소 및 시간 컨텍스트 */}
                <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-4">
                    <div className="flex flex-col space-y-1">
                        <span className="text-slate-400">Where</span>
                        <span className="font-medium flex items-center gap-1">
                            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {memory.context.place_name}
                        </span>
                    </div>
                    <div className="flex flex-col text-right space-y-1">
                        <span className="text-slate-400">When</span>
                        <span className="font-medium">{date.toLocaleDateString()}</span>
                        <span className="text-slate-500 text-xs">{date.toLocaleTimeString()}</span>
                    </div>
                </div>

                {/* 재생 컨트롤 버튼 */}
                <div className="flex justify-center">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    >
                        {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>
                </div>
            </motion.div>

        </main>
    );
}
