import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AiFloatingWidget } from "@/components/ai/AiFloatingWidget";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushInit from "@/components/PushInit";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch the session server-side using Better Auth guidelines
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Extract user ID if available, otherwise fallback to guest tracking
  const currentUserId = session?.user?.id;
  console.log(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        <TooltipProvider>
          <div className="min-h-screen bg-linear-to-br from-[#a5bad3] via-[#b7ceeb] to-[#bfd6f0]">
            {/* <ServiceWorkerRegister />
            <PushInit /> */}
            {children}

            {/* Global freely draggable AI Co-Pilot Widget */}
            {currentUserId && <AiFloatingWidget userId={currentUserId} />}
          </div>

          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
