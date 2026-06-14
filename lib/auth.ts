import { betterAuth } from "better-auth";
import prisma from "@/lib/prisma";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  plugins:[admin()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Bypasses explicit verification check loops on sign-in
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: "STUDENT",
              emailVerified: true, // Forces every record to save as true instantly
            },
          };
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

