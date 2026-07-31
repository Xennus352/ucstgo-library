"use client";

import Image from "next/image";
import {
  ArrowRight,
  Clock,
  MapPin,
  Mail,
  Code2,
  ExternalLink,
} from "lucide-react";
import { brandConfig } from "@/config/brand";

const quickLinks = [
  {
    label: "LMS",
    href: "https://lms.ucstaungoo.edu.mm/",
  },
  {
    label: "University of Computer Studies Taungoo",
    href: "https://www.ucstaungoo.edu.mm/",
  },
];

interface StudentFooterProps {
  onNavigate?: (route: string) => void;
}

export function StudentFooter({ onNavigate }: StudentFooterProps) {
  return (
    <footer className="bg-slate-900 w-full text-gray-300 pt-12 sm:pt-16 pb-24 sm:pb-6 border-t-4 border-blue-600 mt-8 sm:mt-12">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
            {/* Brand & Mission */}
            <div>
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-transparent rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-xl mr-2 sm:mr-3">
                  <Image
                    src={brandConfig.logo}
                    alt={`${brandConfig.name} Logo`}
                    width={36}
                    height={36}
                    className="object-contain"
                    style={{ width: "auto", height: "auto" }}
                    priority
                  />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-xl text-white leading-tight">
                    UCS Taungoo
                  </h2>
                  <p className="text-[10px] sm:text-xs text-blue-400 font-medium uppercase tracking-wider">
                    Digital Library
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 leading-relaxed">
                Your hub for academic research, digital archives, and computer
                science study materials.
              </p>
            </div>

            {/* Library Navigation */}
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-4 sm:mb-6 uppercase tracking-wider text-blue-500">
                Library Navigation
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li>
                  <a
                    href="#about"
                    className="hover:text-blue-400 transition flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-1.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                    About The Library
                  </a>
                </li>
                <li>
                  <a
                    href="#commitment"
                    className="hover:text-blue-400 transition flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-1.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                    Our Commitment
                  </a>
                </li>
                <li>
                  <a
                    href="#noticeboard"
                    className="hover:text-blue-400 transition flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-1.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                    Notice Board
                  </a>
                </li>
                <li>
                  <a
                    href="#latestArrivals"
                    className="hover:text-blue-400 transition flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-1.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                    New Arrivals
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate?.("public-ebooks")}
                    className="hover:text-blue-400 transition flex items-center group w-full text-left"
                  >
                    <ArrowRight className="w-3 h-3 mr-1.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                    Public Ebooks
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-4 sm:mb-6 uppercase tracking-wider text-blue-500">
                Quick Links
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition flex items-center group"
                    >
                      <ExternalLink className="w-3 h-3 mr-1.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opening Hours */}
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-4 sm:mb-6 uppercase tracking-wider text-blue-500">
                Opening Hours
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-400">
                <li className="flex items-start">
                  <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-300">Mon - Fri</p>
                    <p className="text-[11px]">9:00 AM - 4:00 PM</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Clock className="w-3.5 h-3.5 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-400">
                      Sat - Sun & Holidays
                    </p>
                    <p className="text-[11px] text-red-400">Closed</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Library Contact Info */}
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-4 sm:mb-6 uppercase tracking-wider text-blue-500">
                Library Helpdesk
              </h3>
              <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                <li className="flex items-start">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>UCS Taungoo Campus</span>
                </li>
                <li className="flex items-start min-w-0">
                  <Mail className="w-3.5 h-3.5 text-blue-500 mt-1 mr-2 sm:mr-3 shrink-0" />
                  <a
                    href="mailto:library@ucstaungoo.edu.mm"
                    className="hover:text-blue-500 hover:underline break-all"
                  >
                    library@ucstaungoo.edu.mm
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Sub-Footer Bar */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            {/* Developer Credit */}
            <div className="flex items-center space-x-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Developed by</span>
              <a
                href="https://github.com/Xennus352"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white hover:text-blue-400 hover:underline transition-colors"
              >
                SMK
              </a>
            </div>

            {/* Copyright */}
            <p>
              © {new Date().getFullYear()} UCS Taungoo Library. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
