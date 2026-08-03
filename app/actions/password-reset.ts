"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { sendEmail } from "@/lib/email";
import { randomBytes, scrypt } from "node:crypto";

async function sendResetStatusEmail(email: string, status: string) {
  const subject = status === "COMPLETED"
    ? "Password Reset Accepted - UCST Go Library"
    : "Password Reset Rejected - UCST Go Library";

  const text = status === "COMPLETED"
    ? `Your password reset request has been accepted. You can now log in with your new password.\n\nIf you did not request this change, please contact the library administration immediately.`
    : `Your password reset request has been rejected by an administrator. Please contact the library administration for assistance.`;

  await sendEmail({ to: email, subject, text });
}

const N = 16384;
const r = 16;
const p = 1;
const dkLen = 64;
const maxmem = 128 * N * r * 2;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, dkLen, { N, r, p, maxmem }, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });
  return `${salt}:${key.toString("hex")}`;
}

export async function forgotPasswordAction(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return {
        success: false,
        error: "No account found with this email address.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters.",
      };
    }

    const passwordHash = await hashPassword(password);
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        token,
        status: "PENDING",
        requestedPasswordHash: passwordHash,
        expiresAt,
      },
    });

    try {
      getIO()?.emit("password-reset:requested", { userId: user.id, email: user.email });
    } catch {}

    return {
      success: true,
      message:
        "Password reset request submitted. An admin will review your request.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function acceptPasswordResetAction(requestId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Authentication required." };
    }

    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "LIBRARIAN") {
      return {
        success: false,
        error: "Unauthorized. Only admins and librarians can accept password resets.",
      };
    }

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });

    if (!resetRequest) {
      return { success: false, error: "Reset request not found." };
    }

    if (resetRequest.status !== "PENDING") {
      return { success: false, error: "This request has already been processed." };
    }

    if (new Date(resetRequest.expiresAt) < new Date()) {
      return { success: false, error: "This request has expired." };
    }

    const requestedPasswordHash = resetRequest.requestedPasswordHash;
    if (!requestedPasswordHash) {
      return { success: false, error: "No password hash found in the request." };
    }

    const userId = resetRequest.userId;

    await prisma.$transaction(async (tx: any) => {
      const account = await tx.account.findFirst({
        where: { userId, providerId: "credential" },
      });

      if (account) {
        await tx.account.update({
          where: { id: account.id },
          data: { password: requestedPasswordHash },
        });
      } else {
        await tx.account.create({
          data: {
            providerId: "credential",
            accountId: userId,
            userId,
            password: requestedPasswordHash,
          },
        });
      }

      await tx.session.deleteMany({ where: { userId } });

      await tx.passwordResetRequest.update({
        where: { id: requestId },
        data: { status: "COMPLETED" },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "Password Reset Accepted",
          message: `Your password reset request has been accepted. You can now log in with your new password.`,
        },
      });
    });

    try {
      getIO()?.to(userId).emit("password-reset:completed", { userId });
    } catch {}

      const user_ = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user_?.email) sendResetStatusEmail(user_.email, "COMPLETED");

      revalidatePath("/admin/books");
    revalidatePath("/librarian/books");

    return {
      success: true,
      message: "Password reset request accepted. User can now log in with their requested password.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function rejectPasswordResetAction(requestId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Authentication required." };
    }

    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "LIBRARIAN") {
      return {
        success: false,
        error: "Unauthorized. Only admins and librarians can reject password resets.",
      };
    }

    const resetRequest = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });

    if (!resetRequest) {
      return { success: false, error: "Reset request not found." };
    }

    if (resetRequest.status !== "PENDING") {
      return { success: false, error: "This request has already been processed." };
    }

    const userId = resetRequest.userId;

    await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: "Password Reset Rejected",
        message: `Your password reset request has been rejected by an administrator. Please contact support for assistance.`,
      },
    });

    try {
      getIO()?.to(userId).emit("password-reset:rejected", { userId });
    } catch {}

    const user_ = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user_?.email) sendResetStatusEmail(user_.email, "REJECTED");

    revalidatePath("/admin/books");
    revalidatePath("/librarian/books");

    return {
      success: true,
      message: "Password reset request rejected. User has been notified.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function checkPasswordResetStatusAction(email: string) {
  try {
    if (!email?.trim()) {
      return { success: false, error: "Email is required." };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: { id: true },
    });

    if (!user) {
      return { success: true, requests: [] };
    }

    const requests = await prisma.passwordResetRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, createdAt: true, updatedAt: true },
    });

    return {
      success: true,
      requests: requests.map((r: any) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to check reset status.",
    };
  }
}

export async function getPasswordResetRequests() {
  try {
    const resetRequests = await prisma.passwordResetRequest.findMany({
      where: { status: { in: ["PENDING", "COMPLETED", "REJECTED"] } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: resetRequests };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch password reset requests.",
    };
  }
}
