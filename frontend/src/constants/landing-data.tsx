import {
    IconMusic,
    IconHistory,
    IconMoodSmile,
    IconDeviceMobile,
} from "@tabler/icons-react";

/**
 * 랜딩 페이지 기능 소개 데이터
 * 의도(Why): 기능 목록을 분리 관리하여 수정이 용이하도록 합니다.
 */
export const featuresData = [
    {
        title: "음악으로 기억하는 하루",
        description:
            "그 날의 기분과 어울리는 음악을 배경으로 일기를 작성하세요. 텍스트 너머의 감성이 생생하게 보존됩니다.",
        icon: <IconMusic className="h-4 w-4 text-emerald-400" />,
    },
    {
        title: "Spotify 자동 스크로블링",
        description:
            "연동된 Spotify 계정을 통해 내가 지금 듣고 있는, 혹은 최근 들었던 음악들을 자동으로 수집합니다.",
        icon: <IconHistory className="h-4 w-4 text-emerald-400" />,
    },
    {
        title: "감정 기반 타임라인",
        description:
            "일기에 담긴 감정을 분석하여, 나만의 감동적인 타임라인 뷰를 제공합니다.",
        icon: <IconMoodSmile className="h-4 w-4 text-emerald-400" />,
    },
    {
        title: "언제 어디서나 반응형",
        description:
            "데스크탑, 태블릿, 모바일 기기 어디서든 유려한 스큐어모피즘 UI를 경험하세요.",
        icon: <IconDeviceMobile className="h-4 w-4 text-emerald-400" />,
    },
];

/**
 * 랜딩 페이지 사용법 안내 (Sticky Scroll) 데이터
 */
export const scrollContentsData = [
    {
        title: "1. Google 계정으로 로그인",
        description:
            "단 한 번의 클릭으로 Musitory에 첫 발을 내딛으세요. 복잡한 가입 절차 없이 빠르고 안전하게 시작할 수 있습니다. 당신의 일상은 소중하게 보관됩니다.",
        content: (
            <div className="h-full w-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white">
                <IconDeviceMobile className="h-20 w-20 text-white/50" />
            </div>
        ),
    },
    {
        title: "2. Spotify 연동",
        description:
            "당신의 재생 목록이 곧 일기장이 됩니다. Spotify 계정을 연결하면 지금 듣고 있는 음악이 자동으로 다이어리의 배경음악으로 기록됩니다.",
        content: (
            <div className="h-full w-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white">
                <IconMusic className="h-20 w-20 text-white/50" />
            </div>
        ),
    },
    {
        title: "3. 감정 기록 및 보관",
        description:
            "그 순간의 감정과 짧은 메모를 남기세요. 음악과 함께 저장된 기억은 시간이 지나도 생생하게 다시 꺼내어 볼 수 있는 당신만의 타임캡슐이 됩니다.",
        content: (
            <div className="h-full w-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white">
                <IconMoodSmile className="h-20 w-20 text-white/50" />
            </div>
        ),
    },
];

/**
 * 랜딩 페이지 사용자 후기 플로팅 (Infinite Moving Cards) 데이터
 */
export const testimonialsData = [
    {
        quote:
            "이 앱을 쓰고 나서부터 음악을 듣는 방식이 완전히 달라졌어요. 그 날 들었던 음악을 다시 들으면 일기를 썼을 때의 감정이 그대로 되살아납니다.",
        name: "김수아",
        title: "Musitory 유저",
    },
    {
        quote:
            "Spotify 연동이 신의 한 수네요. 내가 의식하지 않아도 백그라운드에서 스크로블링 되니까 기록에 대한 부담이 없어서 너무 좋습니다.",
        name: "이준호",
        title: "음악 애호가",
    },
    {
        quote:
            "감성을 자극하는 UI 디자인 덕분에 매일 밤 자기 전에 일기 쓰는 시간이 기다려져요. 플레이어 UI가 특히 마음에 듭니다.",
        name: "박지민",
        title: "디자이너",
    },
    {
        quote:
            "과거에 남겼던 타임라인을 쭉 돌아보는 재미가 쏠쏠합니다. 그 때 이런 기분으로 이 노래를 들었구나 하면서 추억 여행을 하게 되네요.",
        name: "최윤진",
        title: "대학생",
    },
];
