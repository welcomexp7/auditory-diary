"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center bg-slate-950",
                className
            )}
        >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <svg
                className="absolute inset-0 h-full w-full stroke-emerald-500/30"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="pattern"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path d="M0 40V.5H40" fill="none" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" strokeWidth="0" fill="url(#pattern)" />
            </svg>
        </div>
    );
};
