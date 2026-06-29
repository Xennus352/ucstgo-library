"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function LogoutButton() {
  const router = useRouter();
  const { refreshUser } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      await signOut({
        fetchOptions: {
          onSuccess: async () => {
            await refreshUser(undefined, {
              revalidate: false,
            });

            window.location.href = "/";
            router.refresh();
          },
          onError: (ctx) => {
            console.error(ctx.error);
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          className={`
            relative w-full group px-4 py-6 
            bg-gradient-to-r from-transparent to-transparent
            hover:from-red-50/50 hover:to-red-50/30
            dark:hover:from-red-950/30 dark:hover:to-red-950/20
            border-2 border-transparent hover:border-red-200/50
            dark:hover:border-red-800/30
            rounded-xl transition-all duration-300 ease-out
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm hover:shadow-md
            ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
          `}
          onClick={handleLogout}
          disabled={isLoading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Background Glow Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/5 group-hover:to-red-500/10 transition-all duration-500" />

          <div className="relative flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {/* Icon Container with Pulse Effect */}
              <div
                className={`
                relative p-2.5 rounded-xl
                bg-gradient-to-br from-red-100 to-red-50
                dark:from-red-950/50 dark:to-red-900/30
                group-hover:from-red-200 group-hover:to-red-100
                dark:group-hover:from-red-800/60 dark:group-hover:to-red-700/40
                transition-all duration-300
                ${isHovered ? "scale-110 rotate-[-5deg]" : ""}
                shadow-inner
              `}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-red-600 dark:text-red-400" />
                ) : (
                  <Power
                    className={`
                    h-5 w-5 text-red-600 dark:text-red-400
                    transition-all duration-300
                    ${isHovered ? "rotate-90" : ""}
                  `}
                  />
                )}
              </div>

              <div className="flex flex-col items-start">
                <span
                  className={`
                  text-sm font-semibold
                  text-gray-700 dark:text-gray-200
                  group-hover:text-red-700 dark:group-hover:text-red-300
                  transition-colors duration-300
                `}
                >
                  {isLoading ? "Logging out..." : "Sign Out"}
                </span>
                <span className="text-xs text-muted-foreground/70 group-hover:text-red-500/70 transition-colors duration-300">
                  {isLoading ? "Please wait..." : "Secure your account"}
                </span>
              </div>
            </div>

            {/* Arrow Indicator */}
            <div
              className={`
              transform transition-all duration-300
              ${isHovered ? "translate-x-1 opacity-100" : "opacity-0 -translate-x-2"}
            `}
            >
              <ArrowRight className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Animated Bottom Border */}
          <div
            className={`
            absolute bottom-0 left-1/2 transform -translate-x-1/2
            h-0.5 bg-gradient-to-r from-red-400/0 via-red-500 to-red-400/0
            transition-all duration-500
            ${isHovered ? "w-full" : "w-0"}
          `}
          />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-3 text-sm bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            ⚠️ Security Notice
          </p>
          <p className="text-xs text-muted-foreground">
            You will be completely signed out.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
