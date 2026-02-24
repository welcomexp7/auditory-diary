"use client";

import { cn } from "@/lib/utils";

/**
 * Aceternity UI 스타일 유성 효과 컴포넌트
 * 의도(Why): 배경에 유성이 떨어지는 시각적 효과로 섹션의 깊이감을 연출합니다.
 */
export const Meteors = ({
  number = 12,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  /* SSR 호환: Math.random 대신 결정론적 위치 */
  const meteors = Array.from({ length: number }, (_, i) => ({
    id: i,
    top: ((i * 37 + 7) % 80) - 10,
    left: ((i * 53 + 13) % 80) + 10,
    delay: ((i * 7) % 50) / 10,
    duration: 3 + (i % 4),
  }));

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-full bg-emerald-400/40 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        >
          <div className="absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-emerald-400/50 to-transparent" />
        </span>
      ))}
    </div>
  );
};
