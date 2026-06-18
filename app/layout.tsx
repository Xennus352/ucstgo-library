import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UCSTGO Digital Library",
  description: "E-book and online library of COMPUTER UNIVERSITY(TAUNGOO)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        <TooltipProvider>
          <div className="min-h-screen bg-linear-to-br from-[#a5bad3] via-[#b7ceeb] to-[#bfd6f0]">
            {children}
          </div>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
