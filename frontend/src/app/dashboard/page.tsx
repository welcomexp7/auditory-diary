"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ---------- 타입 정의 ----------
interface DiaryTrack {
    title: string;
    artist: string;
    album_artwork_url: string;
}

interface DiaryContext {
    place_name: string;
    weather: string;
}

interface DiaryEntry {
    id: string;
    track: DiaryTrack;
    context: DiaryContext;
    listened_at: string;
    memo?: string | null;
}

// ---------- 게스트용 Mock 데이터 ----------
const MOCK_DIARIES: DiaryEntry[] = [
    {
        id: "1",
        track: { title: "밤편지", artist: "아이유", album_artwork_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80" },
        context: { place_name: "서울 반포한강공원", weather: "Clear" },
        listened_at: "2024-05-12T20:30:00Z",
        memo: "강바람 맞으며 듣기 좋은 밤"
    },
    {
        id: "2",
        track: { title: "Hype Boy", artist: "NewJeans", album_artwork_url: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80" },
        context: { place_name: "강남역 11번 출구", weather: "Clouds" },
        listened_at: "2024-05-11T14:15:00Z"
    }
];

// ---------- 로그아웃 확인 모달 ----------
function LogoutModal({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 아이콘 */}
                        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">로그아웃</h3>
                        <p className="text-sm text-slate-400 mb-6">정말 로그아웃 하시겠습니까?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-600 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ---------- 메인 컴포넌트 ----------
export default function Dashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [userName, setUserName] = useState("G");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // 로그인 상태 확인 및 데이터 로드
    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem("access_token");

        if (!token) {
            setIsLoggedIn(false);
            setUserName("G");
            const cached = localStorage.getItem("guest_diaries");
            if (cached) {
                try { setDiaries(JSON.parse(cached)); } catch { setDiaries(MOCK_DIARIES); }
            } else {
                setDiaries(MOCK_DIARIES);
                localStorage.setItem("guest_diaries", JSON.stringify(MOCK_DIARIES));
            }
            setIsLoading(false);
            return;
        }

        setIsLoggedIn(true);
        setUserName("JH");

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
            const res = await fetch(`${API_URL}/diaries/me/recently-played`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.diaries && data.diaries.length > 0) {
                    setDiaries(data.diaries);
                    setSpotifyConnected(true);
                } else {
                    setDiaries([]);
                    setSpotifyConnected(data.message ? false : true);
                }
            } else {
                setDiaries([]);
            }
        } catch (err) {
            console.error("데이터 로드 실패:", err);
            setDiaries([]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

    // Spotify 연동 후 자동 새로고침
    useEffect(() => {
        if (searchParams.get("spotify") === "connected") {
            setSpotifyConnected(true);
            loadDashboardData();
        }
    }, [searchParams, loadDashboardData]);

    // 로그아웃 확정 핸들러
    const handleLogoutConfirm = () => {
        localStorage.removeItem("access_token");
        setShowLogoutModal(false);
        router.push("/");
    };

    // 뒤로가기 핸들러
    const handleGoBack = () => {
        if (isLoggedIn) {
            setShowLogoutModal(true);
        } else {
            router.push("/");
        }
    };

    // 메모 추가/수정
    const handleAddMemo = (id: string, currentMemo?: string | null) => {
        const memo = prompt("메모를 입력해주세요:", currentMemo || "");
        if (memo !== null) {
            const updated = diaries.map(d => d.id === id ? { ...d, memo } : d);
            setDiaries(updated);
            if (!isLoggedIn) localStorage.setItem("guest_diaries", JSON.stringify(updated));
        }
    };

    return (
        <>
            {/* 로그아웃 확인 모달 */}
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={handleLogoutConfirm}
                onCancel={() => setShowLogoutModal(false)}
            />

            <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 pb-12 w-full max-w-2xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 pt-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGoBack}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
                        >
                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                                기억의 조각들
                            </h1>
                            <p className="text-xs md:text-sm text-slate-400">당신의 청각적 발자취</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Spotify 버튼: 연결 완료 시 비활성화 */}
                        {isLoggedIn && (
                            spotifyConnected ? (
                                <div className="flex items-center gap-1.5 bg-slate-700 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full cursor-default select-none">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                                    </svg>
                                    <span>Connected</span>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <button
                                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/spotify/login`}
                                    className="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold px-3 py-1.5 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                                    </svg>
                                    <span>Connect</span>
                                </button>
                            )
                        )}

                        {/* 프로필 아바타 */}
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-purple-500 shrink-0">
                            <span className="text-sm font-bold text-white">{userName}</span>
                        </div>
                    </div>
                </header>

                {/* 로딩 */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-sm">데이터를 불러오는 중...</p>
                    </div>
                )}

                {/* Spotify 미연동 안내 */}
                {!isLoading && isLoggedIn && !spotifyConnected && diaries.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-[#1DB954]/20 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Spotify를 연결해주세요</h2>
                        <p className="text-sm text-slate-400 mb-6">최근 들은 음악이 자동으로 타임라인에 기록됩니다.</p>
                        <button
                            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/spotify/login`}
                            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-6 py-3 rounded-full transition-transform hover:scale-105"
                        >
                            🎧 Spotify 연결하기
                        </button>
                    </motion.div>
                )}

                {/* ========== 타임라인 (왼쪽 정렬) ========== */}
                {!isLoading && diaries.length > 0 && (
                    <div className="relative pl-8">
                        {/* 왼쪽 세로 라인 */}
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-slate-700 to-transparent" />

                        <div className="space-y-4">
                            {diaries.map((diary, index) => {
                                const date = new Date(diary.listened_at);
                                return (
                                    <motion.div
                                        key={diary.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.08 }}
                                        className="relative"
                                    >
                                        {/* 타임라인 도트 (왼쪽 라인 위) */}
                                        <div className="absolute -left-8 top-5 w-6 h-6 rounded-full border-[3px] border-slate-900 bg-purple-500 shadow-lg shadow-purple-500/30 z-10 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>

                                        {/* 카드 (가로폭 100%) */}
                                        <div className="w-full p-4 rounded-2xl bg-slate-800/80 backdrop-blur border border-slate-700/50 shadow-xl hover:bg-slate-750 transition-colors">
                                            <div className="flex items-center gap-4">
                                                {/* 앨범 아트 */}
                                                <img
                                                    src={diary.track.album_artwork_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80"}
                                                    alt={diary.track.title}
                                                    className="w-14 h-14 rounded-xl object-cover shadow-md shrink-0"
                                                />

                                                {/* 곡 정보 (넓게 표시) */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white text-base leading-snug truncate">
                                                        {diary.track.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-400 truncate mt-0.5">
                                                        {diary.track.artist}
                                                    </p>
                                                </div>

                                                {/* 재생 시간 */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-slate-500">
                                                        {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-300 mt-0.5">
                                                        {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 메모 영역 */}
                                            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                                                {diary.memo && (
                                                    <p className="text-sm text-slate-300 italic flex-1 mr-3 truncate">
                                                        &quot;{diary.memo}&quot;
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => handleAddMemo(diary.id, diary.memo)}
                                                    className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors flex items-center shrink-0"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                    메모
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 재생 기록 없음 */}
                {!isLoading && isLoggedIn && spotifyConnected && diaries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <p className="text-lg mb-2">🎵 아직 재생 기록이 없어요</p>
                        <p className="text-sm">Spotify에서 음악을 들으면 여기에 나타납니다!</p>
                    </div>
                )}
            </main>
        </>
    );
}
