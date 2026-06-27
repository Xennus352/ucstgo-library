"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Library,
  Users,
  GraduationCap,
  ChevronRight,
  Bell,
  Star,
  MapPin,
  Coffee,
  Wifi,
  Printer,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  PenTool,
  NotepadText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
  // STATS MATRIX CONFIGURATION
  // ===============================
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

  // ===============================
  // LIBRARY PHOTOS (REAL IMAGES)
  // ===============================
  const libraryPhotos: LibraryPhoto[] = [
    {
      id: 1,
      title: "Main Hall",
      description: "Spacious reading area with natural lighting",
      imageUrl:
        "/images/library.jpg",
      category: "interior",
    },
    {
      id: 2,
      title: "Book Stacks",
      description: "Organized shelves with thousands of books",
      imageUrl:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop",
      category: "shelf",
    },
    {
      id: 3,
      title: "Study Area",
      description: "Quiet study spaces for focused learning",
      imageUrl:
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&h=400&fit=crop",
      category: "study",
    },
    {
      id: 4,
      title: "Library Exterior",
      description: "Modern library building entrance",
      imageUrl:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop",
      category: "exterior",
    },
    {
      id: 5,
      title: "Book Shelves",
      description: "Well-organized book collection",
      imageUrl:
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop",
      category: "shelf",
    },
    {
      id: 6,
      title: "Group Study Room",
      description: "Collaborative learning spaces",
      imageUrl:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop",
      category: "study",
    },
  ];

  // ===============================
  // SERVICES
  // ===============================
  const services: FeatureCard[] = [
    {
      icon: BookOpen,
      title: "Borrow Books",
      desc: "Search and borrow physical books easily",
      imageUrl:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=300&fit=crop",
    },
    {
      icon: NotepadText,
      title: "E-Books",
      desc: "Access digital books & journals",
      imageUrl:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop",
    },
    {
      icon: Users,
      title: "Study Rooms",
      desc: "Reserve group or quiet rooms",
      imageUrl:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop",
    },
    {
      icon: Search,
      title: "Search Catalog",
      desc: "Find books by title or author",
      imageUrl:
        "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&h=300&fit=crop",
    },
  ];

  // Fall back to UI mockup states seamlessly if zero data records match from DB
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
    { icon: Coffee, label: "Cafeteria" },
    { icon: Printer, label: "Printing Service" },
    { icon: MapPin, label: "Easy Location" },
  ];

  const filteredPhotos =
    selectedCategory === "all"
      ? libraryPhotos
      : libraryPhotos.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen text-slate-900">
      {/* HERO BACKGROUND WITH OVERLAY */}
      <div className="mx-4 rounded-2xl overflow-hidden">
        <div
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&h=800&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

          <div className="relative max-w-7xl mx-auto px-4 py-12 space-y-8">
            <section className="text-center space-y-6 py-12">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-1.5">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Library Digital System • {time}
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="text-white/90">{greeting},</span>
                <br />
                <motion.span
                  className="bg-gradient-to-r from-blue-300 via-purple-300 to-blue-400 bg-clip-text text-transparent inline-block"
                  style={{ backgroundSize: "200% 200%" }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  Welcome to University Library
                </motion.span>
              </h1>

              <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl">
                Access books, e-resources, and academic materials in one place.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {amenities.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <item.icon className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white/80">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {/* STATS SECTION */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-8 relative z-10">
          {stats.map((s, i) => {
            const Icon = s.icon;
            const colorMap = {
              blue: "from-blue-500 to-blue-600",
              purple: "from-purple-500 to-purple-600",
              green: "from-green-500 to-green-600",
              orange: "from-orange-500 to-orange-600",
            };
            return (
              <div
                key={i}
                className="group bg-white border border-slate-200 rounded-2xl p-5 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`inline-flex p-3 bg-gradient-to-br ${colorMap[s.color as keyof typeof colorMap]} rounded-xl shadow-lg mb-3`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  <Counter value={s.value} />
                </div>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              </div>
            );
          })}
        </section>

        {/* GALLERY */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Library className="w-6 h-6 text-blue-600" />
              Library Gallery
              <Badge variant="outline" className="ml-2">
                <TrendingUp className="w-3 h-3 mr-1" /> Popular
              </Badge>
            </h2>
            <div className="flex gap-2">
              {["all", "interior", "shelf", "study", "exterior"].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-video bg-slate-200">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-white font-semibold text-lg">
                      {photo.title}
                    </h4>
                    <p className="text-white/80 text-sm">{photo.description}</p>
                    <Badge className="mt-1 bg-white/20 text-white border-white/30">
                      {photo.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Library Services
            </h2>
           
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                onClick={() =>
                  onNavigate?.(s.title.toLowerCase().replace(/ /g, "-"))
                }
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="inline-flex p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/20 mb-2">
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LATEST BOOKS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Latest Arrivals
              <Badge className="ml-2 bg-blue-100 text-blue-700 font-medium">
                Recent
              </Badge>
            </h2>
           
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayBooks.map((b, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="h-56 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden relative">
                  <img
                    src={"/api/files/" + b.imageUrl}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-blue-600 text-white font-normal">
                      New
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-500">{b.author}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-slate-400">
                      Published: {b.year}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NOTICE BOARD */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl"></div>

          <div className="relative">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              Notice Board
              <span className="text-sm font-normal text-slate-500 ml-2">
                / အသိပေးချက်
              </span>
            </h3>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl hover:bg-white transition-colors shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                <span className="text-sm text-slate-700">
                  Library open: <strong>8:00 AM – 8:00 PM</strong> (Mon–Sat)
                </span>
              </li>
              <li className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl hover:bg-white transition-colors shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 animate-pulse"></div>
                <span className="text-sm text-slate-700">
                  Return books within <strong>7 days</strong> to avoid late
                  fees.
                </span>
              </li>
              <li className="flex items-start gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl hover:bg-white transition-colors shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                <span className="text-sm text-slate-700">
                  Quiet study area rules must be{" "}
                  <strong>strictly followed</strong>.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center space-y-4 pt-8 border-t border-slate-200">
          <div className="flex justify-center gap-8 text-sm text-slate-500">
            <span className="hover:text-blue-600 cursor-pointer transition-colors hover:underline">
              About
            </span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors hover:underline">
              Contact
            </span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors hover:underline">
              Support
            </span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors hover:underline">
              Privacy
            </span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors hover:underline">
              FAQ
            </span>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 University Library System — Myanmar Academic Network
          </p>
        </footer>
      </div>
    </div>
  );
};
