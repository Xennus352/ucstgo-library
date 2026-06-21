"use client";

import { useState, useRef, useEffect } from "react";
import {
  Brain,
  X,
  Search,
  Sparkles,
  BookOpen,
  Move,
  ChevronDown,
} from "lucide-react";
import { SearchSection } from "./aiSearchBooks";
import { RecommendationsSection } from "./aiRecommendationsSection";
import { BookSummarizer } from "./aiBookSummarizer";

type TabType = "search" | "recommendations" | "summarize";

export function AiFloatingWidget({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("search");
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    posX: 24,
    posY: 24,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);

      setPosition((prev) => ({
        x: Math.max(
          16,
          Math.min(prev.x, window.innerWidth - (mobileCheck ? 80 : 500)),
        ),
        y: Math.max(
          16,
          Math.min(prev.y, window.innerHeight - (mobileCheck ? 80 : 680)),
        ),
      }));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (isOpen && (isMobile || !target.closest(".drag-handle"))) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = dragRef.current.startX - e.clientX;
    const deltaY = dragRef.current.startY - e.clientY;

    const maxAllowedX = window.innerWidth - (isOpen ? 500 : 80);
    const maxAllowedY = window.innerHeight - (isOpen ? 660 : 80);

    const newX = Math.max(
      16,
      Math.min(dragRef.current.posX + deltaX, maxAllowedX),
    );
    const newY = Math.max(
      16,
      Math.min(dragRef.current.posY + deltaY, maxAllowedY),
    );

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const totalDelta =
      Math.abs(dragRef.current.startX - e.clientX) +
      Math.abs(dragRef.current.startY - e.clientY);

    if (totalDelta < 5 && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: `${position.y}px`,
            right: `${position.x}px`,
            zIndex: 9999,
          }}
          className="touch-none select-none transition-transform duration-200"
        >
          <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`
              group relative w-14 h-14 md:w-16 md:h-16 
              rounded-full 
              bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 
              shadow-xl shadow-blue-500/20 
              border border-white/20 
              flex flex-col items-center justify-center 
              text-white cursor-grab active:cursor-grabbing 
              hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/40
              transition-all duration-300
              ${isDragging ? "scale-95 cursor-grabbing" : ""}
            `}
          >
            <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/20 opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
              <Brain className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">
                AI
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Content Panel */}
      {isOpen && (
        <div
          className={`
            fixed z-[99999] flex flex-col 
            bg-slate-950/95 backdrop-blur-2xl 
            border border-white/10 shadow-2xl
            transition-all duration-300 ease-in-out
            
            /* Responsive Layout rules */
            bottom-0 left-0 right-0 h-[88vh] rounded-t-3xl w-full
            md:bottom-auto md:left-auto md:right-auto md:w-[480px] md:h-[640px] md:max-h-[85vh] md:rounded-2xl
            
            animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200
            ${isDragging ? "opacity-80 scale-[0.99]" : ""}
          `}
          style={
            isMobile
              ? undefined
              : {
                  bottom: `${position.y}px`,
                  right: `${position.x}px`,
                }
          }
        >
          {/* Header Bar - Drag Handle */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="
              drag-handle relative px-4 py-4
              bg-white/5 border-b border-white/5 
              flex items-center justify-between 
              cursor-default md:cursor-grab md:active:cursor-grabbing
              flex-shrink-0 rounded-t-3xl md:rounded-t-2xl
            "
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 md:hidden">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            <div className="flex items-center gap-2 mt-1 md:mt-0">
              <Move className="w-3.5 h-3.5 text-cyan-400 hidden md:inline animate-pulse" />
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  AI Assistant Co-Pilot
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                {isMobile ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/40 border-b border-white/5 flex-shrink-0">
            {[
              { id: "search", icon: Search, label: "Search", color: "cyan" },
              {
                id: "recommendations",
                icon: Sparkles,
                label: "Recommend",
                color: "purple",
              },
              {
                id: "summarize",
                icon: BookOpen,
                label: "Analyze",
                color: "amber",
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const colorStyles = {
                cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-cyan-500/5",
                purple:
                  "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5",
                amber:
                  "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
              };

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex flex-col sm:flex-row items-center justify-center gap-1.5 
                    py-2.5 px-1.5 text-[11px] font-medium rounded-xl border border-transparent
                    transition-all duration-200 select-none
                    ${isActive ? `${colorStyles[tab.color as keyof typeof colorStyles]} border shadow-sm` : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}
                  `}
                >
                  <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs tracking-wide">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Scroll Viewport with native inline scroll tracking */}
          <div className="flex-1 overflow-y-auto p-4 text-left bg-slate-950/20 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-250 h-full">
              {activeTab === "search" && <SearchSection />}
              {activeTab === "recommendations" && (
                <RecommendationsSection userId={userId} />
              )}
              {activeTab === "summarize" && <BookSummarizer />}
            </div>
          </div>

          {/* Action Footer */}
          <div className="md:hidden p-3.5 bg-slate-900/20 border-t border-white/5 flex-shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Close Assistant
            </button>
          </div>
        </div>
      )}
    </>
  );
}
