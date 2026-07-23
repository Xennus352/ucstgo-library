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
import { BrandConfigProvider } from "@/components/brand-config-provider";
import { getBrandConfig } from "@/app/actions/get-brand";
import fs from "fs/promises";
import path from "path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const configPath = path.join(process.cwd(), "config", "brand.ts");
  let title = "UCSTGO Digital Library";
  let description = "E-book and online library of COMPUTER UNIVERSITY(TAUNGOO)";
  let favicon = "/icon.png";
  try {
    const text = await fs.readFile(configPath, "utf8");
    const name = text.match(/name:\s*"([^"]+)"/)?.[1];
    const configTitle = text.match(/title:\s*"([^"]+)"/)?.[1];
    const configFavicon = text.match(/favicon:\s*"([^"]+)"/)?.[1];
    if (configTitle) title = configTitle;
    else if (name) title = `${name} Digital Library`;
    if (configFavicon) favicon = configFavicon;
  } catch {}
  return {
    title,
    description,
    icons: { icon: favicon },
  };
}

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
  const initialConfig = await getBrandConfig();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        <TooltipProvider>
          <BrandConfigProvider initialConfig={initialConfig}>
            <div className="min-h-screen bg-linear-to-br from-[#a5bad3] via-[#b7ceeb] to-[#bfd6f0]">
              {/* <ServiceWorkerRegister />
              <PushInit /> */}
              {children}

              {/* Global freely draggable AI Co-Pilot Widget */}
              {currentUserId && <AiFloatingWidget userId={currentUserId} />}
            </div>
          </BrandConfigProvider>

          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
