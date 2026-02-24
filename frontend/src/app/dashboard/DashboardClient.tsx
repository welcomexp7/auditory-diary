"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DailyCapsuleCard from "@/components/ui/daily-capsule-card";

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

interface CapsuleData {
    id: string;
    target_date: string;
    ai_summary: string;
    representative_image_url: string | null;
    theme: string;
}

interface CalendarSummary {
    date: string;
    record_count: number;
    representative_thumbnail: string | null;
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

    const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [userName, setUserName] = useState("G");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // AI Daily Capsule 상태
    const [capsuleData, setCapsuleData] = useState<CapsuleData | null>(null);
    const [isLoadingCapsule, setIsLoadingCapsule] = useState(false);
    const [showCapsuleModal, setShowCapsuleModal] = useState(false);

    const getKstDateString = (date: Date = new Date()) => {
        const kstOffset = 9 * 60; // Korea Standard Time is UTC+9
        const kstTime = new Date(date.getTime() + (kstOffset + date.getTimezoneOffset()) * 60000);
        return kstTime.toISOString().split('T')[0];
    };

    // 달력 상태
    const [selectedDate, setSelectedDate] = useState<string>(() => getKstDateString());
    const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
    const [calendarSummaries, setCalendarSummaries] = useState<CalendarSummary[]>([]);

    // 로그인 상태 확인 및 데이터 로드 (타임라인)
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

            // 오늘 날짜인지 확인
            const localToday = getKstDateString();
            const isToday = selectedDate === localToday;

            let fetchUrl = `${API_URL}/diaries/me/recently-played`;
            if (!isToday) {
                // 과거 날짜를 선택한 경우 history API 호출
                fetchUrl = `${API_URL}/diaries/history?date=${selectedDate}`;
            }

            const [res, statusRes, capsuleRes] = await Promise.all([
                fetch(fetchUrl, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${API_URL}/diaries/me/status`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${API_URL}/capsules/me?date=${selectedDate}`, { headers: { "Authorization": `Bearer ${token}` } })
            ]);

            if (statusRes.ok) {
                const statusData = await statusRes.json();
                setSpotifyConnected(statusData.spotify_connected);
            } else {
                setSpotifyConnected(false);
            }

            if (capsuleRes.ok) {
                const cData = await capsuleRes.json();
                setCapsuleData(cData);
            } else {
                setCapsuleData(null);
            }

            if (res.ok) {
                const data = await res.json();
                const fetchedDiaries = isToday ? data.diaries : data; // history 응답은 리스트 자체, recently-played는 {diaries: []} 구조
                setDiaries(fetchedDiaries || []);
            } else {
                setDiaries([]);
            }
        } catch (err) {
            console.error("데이터 로드 실패:", err);
            setDiaries([]);
        }
        setIsLoading(false);
    }, [selectedDate]);

    const handleGenerateCapsule = async () => {
        setShowCapsuleModal(true);
        setIsLoadingCapsule(true);
        const token = localStorage.getItem("access_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
        try {
            const res = await fetch(`${API_URL}/capsules/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ target_date: selectedDate })
            });

            if (res.ok) {
                const data = await res.json();
                setCapsuleData(data);
            } else {
                const err = await res.json();
                alert(`캡슐 생성 실패: ${err.detail || '알 수 없는 오류'}`);
                setShowCapsuleModal(false);
            }
        } catch (error) {
            console.error(error);
            alert("캡슐 요청 중 오류가 발생했습니다.");
            setShowCapsuleModal(false);
        } finally {
            setIsLoadingCapsule(false);
        }
    };

    useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

    // 월별 캘린더 요약 로드
    const fetchMonthlySummary = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
        try {
            const res = await fetch(`${API_URL}/diaries/calendar/monthly?year=${year}&month=${month}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCalendarSummaries(data);
            }
        } catch (err) {
            console.error(err);
        }
    }, [currentMonth]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchMonthlySummary();
        }
    }, [isLoggedIn, fetchMonthlySummary]);

    // Spotify 연동 후 자동 새로고침 (window.location.search 사용 — useSearchParams SSR 이슈 회피)
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.search.includes("spotify=connected")) {
            setSpotifyConnected(true);
            loadDashboardData();
        }
    }, [loadDashboardData]);

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
    const handleAddMemo = async (id: string, currentMemo?: string | null) => {
        const memo = prompt("메모를 입력해주세요:", currentMemo || "");
        if (memo === null) return; // 취소

        if (!isLoggedIn) {
            const updated = diaries.map(d => d.id === id ? { ...d, memo } : d);
            setDiaries(updated);
            localStorage.setItem("guest_diaries", JSON.stringify(updated));
            return;
        }

        // 로그인 사용자일 경우 서버 DB에 메모 업데이트 (Full-fix 진행)
        const token = localStorage.getItem("access_token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

        try {
            const res = await fetch(`${API_URL}/diaries/${id}/memo`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ memo: memo || "" }) // None 대신 빈 문자열로 리셋 가능
            });

            if (res.ok) {
                const updated = diaries.map(d => d.id === id ? { ...d, memo } : d);
                setDiaries(updated);
            } else {
                const errData = await res.json();
                alert(`메모 저장 실패: ${errData.detail || '권한이 없습니다.'}`);
            }
        } catch (err) {
            console.error("메모 업데이트 오류:", err);
            alert("네트워크 오류로 인해 메모를 저장하지 못했습니다.");
        }
    };

    // 달력 날짜 생성 헬퍼
    const getDaysInMonth = useCallback((date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => {
            const d = new Date(year, month, i + 1);
            return {
                dayOfWeek: ["일", "월", "화", "수", "목", "금", "토"][d.getDay()],
                dateNum: i + 1,
                dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
            };
        });
    }, []);

    const daysArray = getDaysInMonth(currentMonth);

    return (
        <>
            <div className="min-h-screen bg-[#0d0d0f] text-slate-200 relative overflow-hidden selection:bg-emerald-500/30">
                {/* Film Noise Texture Overlay */}
                <div
                    className="fixed inset-0 min-h-screen pointer-events-none z-0 opacity-20 mix-blend-overlay"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
                />
                {/* Ambient Background Glows */}
                <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none z-0 mix-blend-screen" />
                <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none z-0 mix-blend-screen" />

                {/* 로그아웃 확인 모달 */}
                <LogoutModal
                    isOpen={showLogoutModal}
                    onConfirm={handleLogoutConfirm}
                    onCancel={() => setShowLogoutModal(false)}
                />

                <main className="relative z-10 w-full max-w-2xl mx-auto p-4 md:p-6 pb-20">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-12 pt-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleGoBack}
                                className="w-12 h-12 rounded-full bg-[#151518] flex items-center justify-center transition-all hover:bg-[#1a1a1e] active:scale-95 border border-white/5"
                                style={{ boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.02), 4px 4px 8px rgba(0,0,0,0.5), -4px -4px 8px rgba(255,255,255,0.02)' }}
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 tracking-tight drop-shadow-md">
                                    기억의 조각들
                                </h1>
                                <p className="text-[10px] md:text-xs text-zinc-500 font-medium mt-1">
                                    당신의 청각적 발자취
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Spotify 버튼 */}
                            {isLoggedIn && (
                                spotifyConnected ? (
                                    <div className="flex items-center gap-2 bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1ed760] px-4 py-2 rounded-full cursor-default select-none shadow-[inset_0_0_10px_rgba(29,185,84,0.1)] backdrop-blur-md shrink-0">
                                        <svg className="w-4 h-4 shrink-0 drop-shadow-[0_0_8px_rgba(29,185,84,0.6)]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                                        </svg>
                                        <span className="text-xs tracking-wider font-bold whitespace-nowrap">ON AIR</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse shrink-0" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const token = localStorage.getItem('access_token');
                                            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/spotify/login?token=${token}`;
                                        }}
                                        className="group flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black text-sm font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_4px_14px_rgba(29,185,84,0.4)]"
                                    >
                                        <svg className="w-4 h-4 transition-transform group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                                        </svg>
                                        <span>Connect</span>
                                    </button>
                                )
                            )}
                            {/* 프로필 아바타 (Neumorphism border) */}
                            <div className="w-12 h-12 rounded-full bg-[#151518] flex items-center justify-center shrink-0 border-[3px] border-emerald-500/30"
                                style={{ boxShadow: '8px 8px 16px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.02)' }}>
                                <span className="text-sm font-black text-white">{userName}</span>
                            </div>
                        </div>
                    </header>

                    {/* ========== 캘린더 네비게이터 ========== */}
                    {isLoggedIn && (
                        <div className="mb-10 px-1">
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h2 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-wider font-serif">
                                    {currentMonth.getFullYear()}. {String(currentMonth.getMonth() + 1).padStart(2, '0')}
                                </h2>
                                <button
                                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                    disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}
                                    className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors disabled:opacity-20 disabled:hover:text-zinc-500"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            <div className="flex overflow-x-auto gap-3 pb-4 snap-x border-b border-white/5 hide-scrollbar scroll-smooth">
                                {daysArray.map((day) => {
                                    const isSelected = selectedDate === day.dateStr;
                                    const isToday = day.dateStr === getKstDateString();
                                    const summary = calendarSummaries.find(s => s.date === day.dateStr);
                                    const hasRecord = summary && summary.record_count > 0;

                                    return (
                                        <button
                                            key={day.dateStr}
                                            onClick={() => setSelectedDate(day.dateStr)}
                                            className={`relative shrink-0 w-[68px] h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 snap-center ${isSelected
                                                ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                : "bg-[#151518]/60 hover:bg-[#1a1a1e] border-white/5"
                                                } border backdrop-blur-md overflow-hidden`}
                                        >
                                            {/* 대표 이미지 배경 흐리게 */}
                                            {hasRecord && summary.representative_thumbnail && (
                                                <div
                                                    className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-screen scale-110"
                                                    style={{ backgroundImage: `url(${summary.representative_thumbnail})`, filter: 'blur(3px)' }}
                                                />
                                            )}

                                            <div className="relative z-10 flex flex-col items-center gap-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                    {day.dayOfWeek}
                                                </span>
                                                <span className={`text-xl font-black ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                                    {day.dateNum}
                                                </span>

                                                {/* 기록 표시 점 */}
                                                {hasRecord ? (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                ) : isToday ? (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1" />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 mt-1" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 로딩 */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-32">
                            <motion.div
                                className="w-16 h-16 border-[3px] border-zinc-800 border-t-emerald-500 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p className="mt-6 text-sm text-zinc-500 tracking-widest uppercase">Reading records...</p>
                        </div>
                    )}

                    {/* Spotify 미연동 안내 — 데이터가 있으면 타임라인을 보여주고, 데이터가 없을 때만 풀카드 표시 */}
                    {!isLoading && isLoggedIn && !spotifyConnected && diaries.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl bg-[#151518]/80 backdrop-blur-xl border border-white/5"
                            style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}
                        >
                            <div className="w-24 h-24 rounded-full bg-[#1DB954]/10 shadow-[0_0_40px_rgba(29,185,84,0.1)] flex items-center justify-center mb-8 border border-[#1DB954]/20">
                                <svg className="w-12 h-12 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.3 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.681 18.72 12.96c.361.181.54.84.241 1.08zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.08-1.26 11.16-1.02 15.480 3.12.54.54.480 1.321-.061 1.801-.481.48-1.32.42-1.8-.061z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Spotify를 연결해주세요</h2>
                            <p className="text-sm text-zinc-400 mb-8 max-w-xs leading-relaxed">최신 트랙들이 자동으로 감성적인 타임라인으로 기록됩니다.</p>
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('access_token');
                                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/spotify/login?token=${token}`;
                                }}
                                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold px-8 py-4 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(29,185,84,0.3)]"
                            >
                                CONNECT SPOTIFY
                            </button>
                        </motion.div>
                    )}

                    {/* ========== 타임라인 (Glassmorphism & Skeuomorphism) ========== */}
                    {!isLoading && diaries.length > 0 && (
                        <div className="relative pl-10 md:pl-12 mt-8 w-full max-w-4xl mx-auto">

                            {/* Daily Capsule CTA Button (인라인) */}
                            {!capsuleData && !isLoadingCapsule && (
                                <div className="-ml-10 md:-ml-12 w-[calc(100%+2.5rem)] md:w-[calc(100%+3rem)] mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full flex justify-center py-4"
                                    >
                                        <button
                                            onClick={handleGenerateCapsule}
                                            className="group relative px-8 py-4 rounded-full transition-all duration-500 bg-[#151518]/80 hover:bg-[#1a1a1e] backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                            <div className="relative z-10 flex items-center gap-3">
                                                <span className="text-xl animate-pulse">✨</span>
                                                <span className="text-emerald-400 font-medium tracking-wide">오늘의 AI 캡슐 만들기</span>
                                            </div>
                                        </button>
                                    </motion.div>
                                </div>
                            )}
                            {capsuleData && (
                                <div className="-ml-10 md:-ml-12 w-[calc(100%+2.5rem)] md:w-[calc(100%+3rem)] mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="w-full flex justify-center py-4"
                                    >
                                        <button
                                            onClick={() => setShowCapsuleModal(true)}
                                            className="group relative px-8 py-4 rounded-full transition-all duration-500 bg-[#151518]/80 hover:bg-[#1a1a1e] backdrop-blur-xl border border-emerald-400/50 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                            <div className="relative z-10 flex items-center gap-3">
                                                <span className="text-xl">💊</span>
                                                <span className="text-emerald-400 font-medium tracking-wide">오늘의 캡슐 다시 보기</span>
                                            </div>
                                        </button>
                                    </motion.div>
                                </div>
                            )}

                            {/* 왼쪽 타임라인 선 (Glowing) — 항상 타임라인 아이템과 정렬 */}
                            <div className="absolute left-[15px] md:left-[19px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/80 via-zinc-800 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.5)]" />

                            <div className="space-y-8 relative z-10">
                                {diaries.map((diary, index) => {
                                    const date = new Date(diary.listened_at);
                                    return (
                                        <motion.div
                                            key={diary.id}
                                            initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                            transition={{ duration: 0.6, delay: index * 0.1, type: "spring", bounce: 0.3 }}
                                            className="relative group block"
                                        >
                                            {/* 타임라인 노드 (LED 형태) */}
                                            <div className="absolute -left-8 md:-left-9 top-8 w-4 h-4 rounded-full border border-emerald-400/50 bg-[#0d0d0f] z-10 flex items-center justify-center transition-all group-hover:scale-125 group-hover:border-emerald-400 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 group-hover:bg-emerald-400 transition-colors" />
                                            </div>

                                            {/* Glassmorphism 카드 */}
                                            <div
                                                className="w-full p-5 rounded-3xl bg-[#151518]/70 backdrop-blur-xl border border-white/5 transition-all duration-300 hover:bg-[#1a1a1e]/90 hover:border-white/10 relative overflow-hidden"
                                                style={{ boxShadow: '8px 8px 24px rgba(0,0,0,0.6), -4px -4px 12px rgba(255,255,255,0.01)' }}
                                            >
                                                {/* Hover Glow */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-teal-500/0 to-emerald-500/0 opacity-0 group-hover:opacity-100 group-hover:from-emerald-500/5 group-hover:via-transparent transition-all duration-700 pointer-events-none" />

                                                <div className="flex flex-col sm:flex-row gap-5 relative z-10">
                                                    {/* 앨범 아트 (Vinyl Sleeve Metaphor) */}
                                                    <div className="relative shrink-0 w-20 h-20 md:w-24 md:h-24">
                                                        <div className="absolute inset-0 bg-black rounded-xl transform translate-x-3 translate-y-1 shadow-lg opacity-40 border border-zinc-800" />
                                                        <img
                                                            src={diary.track.album_artwork_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80"}
                                                            alt={diary.track.title}
                                                            className="relative w-full h-full rounded-xl object-cover shadow-2xl border border-white/10 z-10"
                                                        />
                                                    </div>

                                                    {/* 곡 정보 */}
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Seoul' })}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                                                                {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Seoul' })}
                                                            </p>
                                                        </div>

                                                        <h3 className="font-extrabold text-white text-lg md:text-xl leading-tight truncate tracking-tight drop-shadow-sm mb-1 group-hover:text-emerald-50 transition-colors">
                                                            {diary.track.title}
                                                        </h3>
                                                        <p className="text-sm font-medium text-zinc-400 truncate">
                                                            {diary.track.artist}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* 메모 영역 (Typewriter / Ink Metaphor) */}
                                                <div className="mt-5 pt-4 border-t border-white/5 flex items-start sm:items-center justify-between gap-4 relative z-10">
                                                    {diary.memo ? (
                                                        <p className="text-sm text-zinc-300 flex-1 font-serif italic tracking-wide leading-relaxed pl-2 border-l-[3px] border-zinc-700">
                                                            &quot;{diary.memo}&quot;
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-zinc-600 flex-1 italic">
                                                            빈 여백의 시간...
                                                        </p>
                                                    )}

                                                    <button
                                                        onClick={() => handleAddMemo(diary.id, diary.memo)}
                                                        className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors border border-white/5 flex items-center gap-2"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        기록
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 빈 상태 처리 (Empty State) */}
                    {!isLoading && isLoggedIn && diaries.length === 0 && spotifyConnected && (
                        <div className="flex flex-col items-center justify-center py-32 opacity-60">
                            <svg className="w-16 h-16 text-zinc-700 mb-6 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <p className="text-lg font-bold text-zinc-400 mb-2 tracking-wide block">
                                {selectedDate === getKstDateString()
                                    ? "아직 비어있는 일기장"
                                    : selectedDate > getKstDateString()
                                        ? "아직 오지 않은 시간"
                                        : "빈 여백의 시간..."}
                            </p>
                            <p className="text-sm text-zinc-600 text-center font-medium leading-relaxed">
                                {selectedDate === getKstDateString()
                                    ? <>Spotify에서 음악을 재생하면<br />자동으로 이곳에 기록됩니다.</>
                                    : selectedDate > getKstDateString()
                                        ? <>이 날엔 어떤 음악이 당신과 함께할까요?<br />미래의 기록을 기대해봅니다.</>
                                        : <>이 날은 음악과 함께한 기록이 없네요.<br />기억의 빈 페이지로 남아있습니다.</>
                                }
                            </p>
                        </div>
                    )}
                </main>
            </div>

            {/* ========== AI Daily Capsule 풀스크린 모달 (Dimmer) ========== */}
            <AnimatePresence>
                {showCapsuleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                    >
                        {/* Dimmer Background — 클릭 시 모달 닫기 */}
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => { if (!isLoadingCapsule) setShowCapsuleModal(false); }}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isLoadingCapsule ? (
                                <div className="w-full aspect-[9/16] rounded-[2.5rem] bg-[#111113] border border-white/5 flex flex-col items-center justify-center p-8 shadow-2xl">
                                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-[spin_1.5s_ease-in-out_infinite] mb-8" />
                                    <p className="text-emerald-400/80 font-mono text-sm tracking-widest text-center animate-pulse">
                                        AI is curating your day...
                                    </p>
                                    <p className="text-zinc-600 text-xs mt-4 tracking-wide">잠시만 기다려주세요</p>
                                </div>
                            ) : capsuleData ? (
                                <DailyCapsuleCard
                                    dateStr={selectedDate}
                                    aiSummary={capsuleData.ai_summary}
                                    representativeImageUrl={capsuleData.representative_image_url}
                                    theme={capsuleData.theme as any}
                                />
                            ) : null}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
