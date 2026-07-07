"use client";

import { Link } from "@/lib/routing";
import { useTranslations } from "next-intl";

type StarConfig = {
    top: string;
    left: string;
    size: number;
    rotate: number;
    blur?: boolean;
    delay?: string;
    duration?: string;
    opacity?: number;
  };

  const stars: StarConfig[] = [
    { top: "22%", left: "13%", size: 52, rotate: -12, delay: "0s", duration: "3.2s", opacity: 1 },
    { top: "19%", left: "33%", size: 18, rotate: 24, delay: "0.8s", duration: "2.8s", opacity: 0.35 },
    { top: "90%", left: "40%", size: 32, rotate: 24, delay: "0.8s", duration: "2.8s", opacity: 0.35 },
    { top: "20%", left: "60%", size: 72, rotate: 24, delay: "0.8s", duration: "2.8s", opacity: 0.35 },
    { top: "21%", left: "86%", size: 58, rotate: -28, blur: true, delay: "1.4s", duration: "3.6s", opacity: 0.95 },
    { top: "18%", left: "93%", size: 18, rotate: 36, delay: "2s", duration: "2.6s", opacity: 0.35 },
    { top: "76%", left: "9%", size: 100, rotate: 90, blur: true, delay: "2s", duration: "4s", opacity: 0.9 },
    { top: "84%", left: "64%", size: 18, rotate: -40, delay: "1.2s", duration: "2.4s", opacity: 0.3 },
    { top: "66%", left: "85%", size: 200, rotate: 20, blur: true, delay: "1.8s", duration: "4.4s", opacity: 0.85 },
  ];

  function Star({
    top,
    left,
    size,
    rotate,
    blur = false,
    delay = "0s",
    duration = "3s",
    opacity = 1,
  }: StarConfig) {
    return (
            <div
            className="pointer-events-none absolute"
            style={{
                top,
                left,
                width: size,
                height: size,
                opacity,
                transform: `rotate(${rotate}deg)`,
            }}
            >
            <svg
                viewBox="0 0 155 155"
                className={`submission-star h-full w-full ${blur ? "blur-[6px]" : ""}`}
                style={{
                animationDelay: delay,
                animationDuration: duration,
                }}
            >
          <path
            d="M77.5 0C74.0068 28.5131 72.8518 46.6188 66.0263 58.3065C54.8687 72.8337 35.529 74.2173 0 77.5C34.9531 81.7292 53.8516 82.6458 65.0418 95.9538C73.4022 107.735 74.8167 125.959 77.5 155C82.0574 117.335 82.7714 98.3143 99.2862 87.4908C111.029 81.8191 128.551 80.5811 155 77.5C122.204 73.4821 103.175 72.5575 91.8468 62.5389C82.2677 51.1192 81.246 32.1569 77.5 0Z"
            fill="white"
          />
        </svg>
      </div>
    );
  }

export function SubmissionSuccess() {
    const t = useTranslations("submissionSuccess");
    return (
<div className="relative z-10 flex h-dvh w-full items-center justify-center overflow-hidden px-4">        {stars.map((star, i) => (
          <Star key={i} {...star} />
        ))}
  
        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
          <h1 className="font-display text-3xl font-black text-white sm:text-6xl">
          {t("title")}
          </h1>
  
          <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">         
          {t("description")}
          </p>
  
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">            <Link
              href="/feed"
              className="inline-flex min-w-[180px] items-center justify-center rounded-[20px] border border-white/25 bg-white px-8 py-5 text-lg font-black uppercase tracking-wide text-ink shadow-[0_6px_24px_rgba(255,255,255,0.18)] transition hover:bg-white/90"
            >
             {t("feed")}
            </Link>
  
            <Link
              href="/rewards"
              className="inline-flex min-w-[220px] items-center justify-center rounded-[20px] border border-white/45 bg-white/5 px-8 py-5 text-lg font-black uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white/10"
            >
             {t("rewards")}
            </Link>
          </div>
        </div>
      </div>
    );
  }