"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Bookmark,
  Download,
  Library,
  Users,
  Clock,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// =========================================================================
// INLINE REPLICAS OF THE ANIMATIONS (No extra npm package required!)
// =========================================================================

// Elegant Shimmer/Shine Text
const ShinyText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-white via-blue-400 to-white bg-[200%_auto] animate-shine text-transparent bg-clip-text ${className}`}
    >
      {text}
    </span>
  );
};

// Blur Text Entrance Effect
const BlurText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const words = text.split(" ");
  return (
    <p className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-1.5"
          initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  );
};

// Subtle Animated Wave Background Mesh
const WaveBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 -z-10">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 100 Q 300 350, 600 150 T 1200 250 T 1800 50 L 1800 1000 L 0 1000 Z"
          fill="url(#waveGrad)"
          animate={{
            d: [
              "M0 100 Q 300 350, 600 150 T 1200 250 T 1800 50 L 1800 1000 L 0 1000 Z",
              "M0 130 Q 350 280, 700 180 T 1300 210 T 1800 90 L 1800 1000 L 0 1000 Z",
              "M0 100 Q 300 350, 600 150 T 1200 250 T 1800 50 L 1800 1000 L 0 1000 Z",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

// Interactive Spotlight Card (Hover Tracking)
const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
    >
      {isHovered && (
        <div
          className="absolute pointer-events-none rounded-full blur-[60px] opacity-40 transition-opacity duration-300"
          style={{
            width: "150px",
            height: "150px",
            background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
            left: `${coords.x - 75}px`,
            top: `${coords.y - 75}px`,
          }}
        />
      )}
      {children}
    </div>
  );
};

// Simpler Counter (replaces CountUp)
const Counter: React.FC<{ target: number; suffix?: string }> = ({
  target,
  suffix = "",
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    const duration = 1500;
    const increment = Math.ceil(end / (duration / 16));

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// =========================================================================
// MAIN PAGE VIEW
// =========================================================================

interface HomePageProps {
  onNavigate?: (route: string) => void;
}

export const LibraryHome: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours < 12) setGreeting("Good Morning");
      else if (hours < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Total Books", value: 50000, suffix: "+" },
    { label: "Active Students", value: 15000, suffix: "+" },
    { label: "E-Resources", value: 100000, suffix: "+" },
    { label: "Daily Visitors", value: 2000, suffix: "+" },
  ];

  const featuredCollections = [
    { title: "Computer Science", books: 1234, icon: "💻", seed: "cs" },
    { title: "Engineering", books: 2156, icon: "⚙️", seed: "eng" },
    { title: "Medicine", books: 3421, icon: "🏥", seed: "med" },
    { title: "Business", books: 1876, icon: "📊", seed: "biz" },
  ];

  const services = [
    {
      icon: BookOpen,
      title: "Physical Books",
      desc: "Borrow academic and reference books easily",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      icon: Download,
      title: "E-Resources",
      desc: "Access digital books, PDFs, and journals",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      icon: Users,
      title: "Study Spaces",
      desc: "Quiet reading and group discussion rooms",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      icon: Clock,
      title: "24/7 Access",
      desc: "Digital library available anytime",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    {
      icon: Bookmark,
      title: "Reservations",
      desc: "Reserve books before visiting library",
      color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      icon: Library,
      title: "Catalog System",
      desc: "Organized search across all materials",
      color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      icon: ShieldCheck,
      title: "Verified Content",
      desc: "Trusted academic and research sources",
      color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
    {
      icon: Search,
      title: "Smart Search",
      desc: "Find books by title, author, or subject",
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Sticky Header Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <ShinyText
              text="UCSTGI Library System"
              className="text-base font-bold tracking-tight"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => onNavigate?.("catalog")}
            >
              Catalog
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => onNavigate?.("ebooks")}
            >
              E-Books
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4"
              onClick={() => onNavigate?.("login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-28">
        {/* HERO INTRO BLOCK */}
        <section className="relative min-h-[65vh] flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-6">
          <WaveBackground />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3.5 py-1.5 text-xs rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-400 inline" />
              Digital Academic Information Desk • {currentTime || "--:--"}
            </Badge>
          </motion.div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] text-slate-100">
            {greeting}, Scholar!
            <br />
            Explore the <ShinyText text="Unified Repository" />
          </h1>

          <BlurText
            text="Welcome to your localized academic gateway. Research collections, real-time index matrices, digital publications, and learning infrastructure options mapped directly to your account station."
            className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed"
          />

          {/* SEARCH TERMINAL */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-xl pt-4"
          >
            <div className="relative group bg-slate-900/60 border border-white/10 focus-within:border-blue-500/50 rounded-xl p-1.5 flex items-center shadow-2xl backdrop-blur-md transition-all duration-300">
              <Search className="w-4 h-4 text-slate-500 ml-3 shrink-0 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query reference documents, syllabus items, or datasets..."
                className="w-full bg-transparent text-sm pl-2.5 pr-4 py-2 focus:outline-hidden text-slate-200 placeholder:text-slate-500"
              />
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 shrink-0 text-xs"
                onClick={() => onNavigate?.("catalog")}
              >
                Search Index
              </Button>
            </div>
          </motion.div>
        </section>

        {/* METRICS HUB */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <SpotlightCard
              key={i}
              className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md"
            >
              <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                <Counter target={stat.value} suffix={stat.suffix} />
              </h3>
            </SpotlightCard>
          ))}
        </section>

        {/* FEATURED PORTALS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-200">
              Featured Reference Matrices
            </h2>
            <p className="text-xs text-slate-500">
              Core structural divisions across institutional data banks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCollections.map((col, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between h-44 p-5 cursor-pointer"
                onClick={() => onNavigate?.("catalog")}
              >
                <div className="text-2xl bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {col.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">
                    {col.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {col.books.toLocaleString()} Volume records
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* UTILITIES GRID */}
        <section className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-200">
              Integrated Support Infrastructure
            </h2>
            <p className="text-xs text-slate-500">
              Operational modules configured to service student workflows
              smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {services.map((srv, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-white/5 bg-slate-900/20 backdrop-blur-xs flex gap-4 items-start"
              >
                <div className={`p-2 rounded-lg shrink-0 border ${srv.color}`}>
                  <srv.icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-200">
                    {srv.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {srv.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONCLUDING HOVER DECK / CALL TO ACTION */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 via-indigo-950/30 to-slate-900 border border-blue-500/20 p-8 sm:p-12 text-center space-y-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
            <Library className="w-10 h-10 text-blue-400 mx-auto opacity-80" />
            <h3 className="text-2xl font-bold tracking-tight text-slate-100">
              Ready to expand your perspective?
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Authenticate via your student credentials profile to initialize
              personalized catalog monitoring shelves or view premium
              documentation feeds.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button
                size="sm"
                className="bg-white text-slate-950 hover:bg-slate-200 text-xs font-semibold"
                onClick={() => onNavigate?.("catalog")}
              >
                Initialize Search
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 text-white text-xs"
                onClick={() => onNavigate?.("about")}
              >
                Read Guides
              </Button>
            </div>
          </div>
        </section>

        {/* MINI FOOTER */}
        <footer className="border-t border-white/5 pt-8 pb-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-600 gap-3">
          <p>
            © 2026 University Library Hub System. Authorized Station Terminal.
          </p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">
              Security Protocol
            </span>
            <span className="hover:text-slate-400 cursor-pointer">
              Index Logs
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
