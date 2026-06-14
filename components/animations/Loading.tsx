"use client";

import { DotLottiePlayer } from "@dotlottie/react-player";
import animationData from "./library.json";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="relative flex flex-col items-center gap-4">
        {/* Lottie Animation Container */}
        <div className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64">
          <DotLottiePlayer
            autoplay
            loop
            src={animationData}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
