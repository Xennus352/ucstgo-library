"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  GraduationCap,
  Bell,
  MapPin,
  Coffee,
  Wifi,
  Printer,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRight,
  Globe,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import TextType from "@/components/TextType";
import Stack from "@/components/Stack";

const Counter = ({ value }: { value: number }) => (
  <span>{value.toLocaleString()}</span>
);

// ===============================
// TYPES
// ===============================
interface FeatureCard {
  title: string;
  desc: string;
  icon: any;
  imageUrl?: string;
}

interface Book {
  title: string;
  author: string;
  year: string;
  imageUrl?: string;
}

interface LibraryPhoto {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: "interior" | "shelf" | "study" | "exterior";
}

interface LibraryMetrics {
  totalBooks: number;
  students: number;
  totalCategories: number;
  totalAuthors: number;
}

interface HomePageProps {
  onNavigate?: (route: string) => void;
  initialCounts?: LibraryMetrics;
  initialLatestBooks?: Book[];
}

export const LibraryHome: React.FC<HomePageProps> = ({
  onNavigate,
  initialCounts,
  initialLatestBooks,
}) => {
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("");

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // State initialized with fallback defaults if initialCounts hasn't loaded yet
  const [counts, setCounts] = useState({
    totalBooks: initialCounts?.totalBooks ?? 50000,
    students: initialCounts?.students ?? 15000,
    totalCategories: initialCounts?.totalCategories ?? 100000,
    totalAuthors: initialCounts?.totalAuthors ?? 1240,
  });

  // Keep internal state updated if initialCounts changes asynchronously
  useEffect(() => {
    if (initialCounts) {
      setCounts({
        totalBooks: initialCounts.totalBooks,
        students: initialCounts.students,
        totalCategories: initialCounts.totalCategories,
        totalAuthors: initialCounts.totalAuthors,
      });
    }
  }, [initialCounts]);

  const images = [
    "https://images.stockcake.com/public/2/5/0/2501b248-7abb-4dfc-b76c-153b7253e5b7_large/coding-among-books-stockcake.jpg",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=900&fit=crop",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&h=900&fit=crop",
  ];

  // Clock & Greeting
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();

      if (h < 12) setGreeting("Good Morning");
      else if (h < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // ===============================
  // LIBRARY PHOTOS
  // ===============================
  const libraryPhotos: LibraryPhoto[] = [
    {
      id: 1,
      title: "Main Reading Hall",
      description:
        "Spacious reading area with natural lighting and comfortable seating",
      imageUrl: "/images/library.jpg",
      category: "interior",
    },
    {
      id: 2,
      title: "Book Collections",
      description:
        "Organized shelves with thousands of academic books and journals",
      imageUrl:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&h=900&fit=crop",
      category: "shelf",
    },
    {
      id: 3,
      title: "Quiet Study Area",
      description: "Dedicated quiet spaces for focused learning and research",
      imageUrl:
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1600&h=900&fit=crop",
      category: "study",
    },
    {
      id: 4,
      title: "Library Entrance",
      description: "Modern library building with welcoming entrance",
      imageUrl:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=900&fit=crop",
      category: "exterior",
    },
  ];

  // Carousel auto-play logic
  useEffect(() => {
    if (!isAutoPlaying) return;

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % libraryPhotos.length);
    }, 6000);

    return () => clearInterval(slideInterval);
  }, [libraryPhotos.length, isAutoPlaying]);

  const handleNextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % libraryPhotos.length);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const handlePrevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide(
      (prev) => (prev - 1 + libraryPhotos.length) % libraryPhotos.length,
    );
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentSlide(index);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const stats = [
    {
      label: "Total Books",
      value: counts.totalBooks,
      icon: BookOpen,
      color: "blue",
    },
    {
      label: "Students",
      value: counts.students,
      icon: GraduationCap,
      color: "purple",
    },
    {
      label: "Total Category",
      value: counts.totalCategories,
      icon: Layers,
      color: "green",
    },
    {
      label: "Authors Total Count",
      value: counts.totalAuthors,
      icon: PenTool,
      color: "orange",
    },
  ];

  const displayBooks =
    initialLatestBooks && initialLatestBooks.length > 0
      ? initialLatestBooks
      : [
          {
            title: "Advanced Mathematics",
            author: "Dr. Smith",
            year: "2026",
            imageUrl:
              "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop",
          },
          {
            title: "Data Science Essentials",
            author: "Prof. Johnson",
            year: "2026",
            imageUrl:
              "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop",
          },
          {
            title: "Physics for Engineers",
            author: "Dr. Williams",
            year: "2025",
            imageUrl:
              "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop",
          },
        ];

  const amenities = [
    { icon: Wifi, label: "Free WiFi" },
    { icon: Printer, label: "Printing Service" },
    { icon: MapPin, label: "Easy Location" },
  ];

  const slideContent = [
    {
      title: "Welcome to University Library",
      subtitle:
        "Access books, e-resources, and academic materials in one place",
      badge: "Library Digital System",
    },
    {
      title: "Discover Our Collections",
      subtitle:
        "Thousands of books, journals, and research materials available",
      badge: "Explore Now",
    },
    {
      title: "Quiet Study Environment",
      subtitle: "Dedicated spaces for focused learning and research",
      badge: "Study Areas",
    },
    {
      title: "Modern Library Facilities",
      subtitle: "State-of-the-art facilities for academic excellence",
      badge: "Facilities",
    },
  ];

  return (
    <div className="min-h-screen text-slate-900 bg-gray-50 flex flex-col">
      {/* HEADER HERO CAROUSEL */}
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${libraryPhotos[currentSlide].imageUrl}')`,
              }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>

        <div className="absolute hidden md:flex top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 items-center gap-2 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
          <span className="text-white/80 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="hidden xs:inline">
              {libraryPhotos[currentSlide].title}
            </span>
            <span className="xs:hidden">Slide {currentSlide + 1}</span>
          </span>
          <span className="w-px h-4 bg-white/20 hidden xs:block"></span>
          <span className="text-white/50 text-xs hidden xs:inline">
            {currentSlide + 1} / {libraryPhotos.length}
          </span>
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-white/90 text-xs sm:text-sm font-medium">
                      {greeting} • {time}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                    <span className="text-white block">
                      {slideContent[currentSlide].title}
                    </span>
                  </h1>

                  <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl">
                    {slideContent[currentSlide].subtitle}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6">
                    {amenities.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 hover:bg-white/20 transition-all duration-300"
                      >
                        <item.icon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        <span className="text-xs sm:text-sm text-white/80">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Button
          onClick={handlePrevSlide}
          className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-110 z-20 group"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
        </Button>
        <Button
          onClick={handleNextSlide}
          className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-110 z-20 group"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
        </Button>

        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
          {libraryPhotos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === index
                  ? "w-6 sm:w-8 md:w-10 h-1.5 sm:h-2 md:h-2.5 bg-white shadow-lg shadow-white/30"
                  : "w-1.5 sm:w-2 md:w-2.5 h-1.5 sm:h-2 md:h-2.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">
          <span className="text-white/80 text-xs sm:text-sm font-medium">
            {String(currentSlide + 1).padStart(2, "0")} /{" "}
            {String(libraryPhotos.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14 w-full flex-grow">
        {/* ABOUT SECTION */}
        <section className="py-4 sm:py-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            {/* FIXED SIZE LAYER FOR THE STACK LAYER */}
            <div className="w-full md:w-1/2 relative flex justify-center">
              <div className="w-[280px] h-[340px] sm:w-[340px] sm:h-[420px] md:w-[380px] md:h-[460px] aspect-[3/4]">
                <Stack
                  randomRotation={false}
                  sensitivity={230}
                  sendToBackOnClick={true}
                  cards={images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`card-${i + 1}`}
                      className="rounded-2xl shadow-md border border-slate-100"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ))}
                  autoplay
                  autoplayDelay={3500}
                  pauseOnHover
                />
              </div>
            </div>

            {/* TEXT DESC BLOCK */}
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                <TextType
                  text={["About the Library"]}
                  typingSpeed={75}
                  pauseDuration={1500}
                  showCursor
                  cursorCharacter="_"
                  deletingSpeed={50}
                  variableSpeedEnabled={false}
                  variableSpeedMin={60}
                  variableSpeedMax={120}
                  cursorBlinkDuration={0.5}
                />
              </h2>
              <div className="w-12 h-1 bg-blue-600 mb-6 rounded-full"></div>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-4">
                University of Computer Studies (Taungoo) Library launched as
                soon as the university was established in 2007. It was then
                situated on 1st floor of building No. D. At that time there were
                1300 volumes of books.
              </p>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Digital software has been used to record the library collections
                since 2013 supported by the Ministry of Science and Technology
                (MOST). eCatalogues are provided at the website. The users can
                search e-catalogue by author, title, subject, keyword search and
                advanced search.
              </p>
            </div>
          </div>
        </section>

        {/* VISION, MISSION, MOTIVATION */}
        <section className="py-4 sm:py-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Our Commitment
            </h2>
            <div className="w-12 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                Vision
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                To support reading competency skills to increase intellectual
                knowledge.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                Mission
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                To promote reading competency skills for university members.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                Motivation
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed italic">
                "Let's promote social skills through reading."
                <br />
                <span className="text-xs sm:text-sm text-slate-500 not-italic">
                  လူမှုဘဝတိုးတက်ဖို့ စာဖတ်ခြင်းနှင့် မြှင့်တင်စို့
                </span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* LATEST ARRIVALS */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Latest Arrivals
              <Badge className="ml-2 bg-blue-100 text-blue-700 font-medium text-xs sm:text-sm">
                Recent
              </Badge>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayBooks.map((b, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-48 sm:h-56 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden relative">
                  <img
                    src={"/api/files/" + b.imageUrl}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-blue-600 text-white font-normal text-xs">
                      New
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {b.author}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-400">
                      Published: {b.year}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* METRICS / STATS CARD COUNTER */}
        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 relative z-10">
          {stats.map((s, i) => {
            const Icon = s.icon;
            const colorMap = {
              blue: "from-blue-500 to-blue-600",
              purple: "from-purple-500 to-purple-600",
              green: "from-green-500 to-green-600",
              orange: "from-orange-500 to-orange-600",
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`inline-flex p-2 sm:p-3 bg-gradient-to-br ${colorMap[s.color as keyof typeof colorMap]} rounded-xl shadow-lg mb-2 sm:mb-3`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-slate-800">
                  <Counter value={s.value} />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {s.label}
                </p>
              </motion.div>
            );
          })}
        </section>

        {/* NOTICE BOARD */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-200/20 rounded-full blur-3xl"></div>

          <div className="relative">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              Notice Board
              <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">
                / အသိပေးချက်
              </span>
            </h3>

            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl hover:bg-white transition-colors shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 animate-pulse"></div>
                <span className="text-xs sm:text-sm text-slate-700">
                  Library open: <strong>8:00 AM – 8:00 PM</strong> (Mon–Sat)
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl hover:bg-white transition-colors shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full mt-1.5 sm:mt-2 animate-pulse"></div>
                <span className="text-xs sm:text-sm text-slate-700">
                  Return books within <strong>7 days</strong> to avoid late
                  fees.
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl hover:bg-white transition-colors shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 animate-pulse"></div>
                <span className="text-xs sm:text-sm text-slate-700">
                  Quiet study area rules must be{" "}
                  <strong>strictly followed</strong>.
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* FOOTER - Full Width */}
      <footer className="bg-slate-900 w-full text-gray-300 pt-12 sm:pt-16 pb-6 sm:pb-8 border-t-4 border-blue-600 mt-8 sm:mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
              {/* Col 1 - Logo & Social */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-xl mr-2 sm:mr-3">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-xl text-white leading-tight">
                      UCS Taungoo
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      University Library
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 leading-relaxed">
                  Find us on social media.
                </p>
                <div className="flex space-x-2 sm:space-x-3">
                  <a
                    href="#"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-xs sm:text-sm font-bold"
                  >
                    F
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-xs sm:text-sm font-bold"
                  >
                    T
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-xs sm:text-sm font-bold"
                  >
                    I
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-xs sm:text-sm font-bold"
                  >
                    Y
                  </a>
                </div>
              </div>

              {/* Col 2 - Quick Links */}
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">
                  Quick Links
                </h3>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      About University
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Academic Calendar
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Admissions
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Library
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3 - Faculties */}
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">
                  Faculties
                </h3>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Computer Science
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Computer Systems &amp; Tech
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Information Science
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 4 - Departments */}
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">
                  Departments
                </h3>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Computing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Natural Languages
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Natural Science
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition flex items-center"
                    >
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-500" />{" "}
                      Administration &amp; Student Affairs
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 5 - Contact Info */}
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="font-bold text-base sm:text-lg text-white mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">
                  Contact Info
                </h3>
                <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  <li className="flex items-start">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span>
                      University of Computer Studies,
                      <br />
                      Taungoo Campus, Myanmar
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 mr-2 sm:mr-3" />
                    <span>+95 123 456 789</span>
                  </li>
                  <li className="flex items-center">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 mr-2 sm:mr-3" />
                    <span className="break-all">
                      ucstgostuaffair2024@gmail.com
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 mr-2 sm:mr-3" />
                    <span>www.ucstaungoo.edu.mm</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Footer Credits */}
            <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-3 sm:gap-0">
              <p className="text-center sm:text-left">
                &copy; 2026 UCS Taungoo. All Rights Reserved. Designed SMK
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <a href="#" className="hover:text-white transition">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white transition">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-white transition">
                  Sitemap
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
