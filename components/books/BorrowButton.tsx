"use client";

import { useState, useTransition } from "react";
import { borrowBookAction } from "@/app/actions/borrow";

interface BorrowButtonProps {
  userId: string;
  bookId: string;
}

export default function BorrowButton({ userId, bookId }: BorrowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleBorrow = () => {
    setMessage(null);

    startTransition(async () => {
      const response = await borrowBookAction(userId, bookId);

      if (response.success) {
        setMessage({ type: "success", text: response.message || "Success!" });
      } else {
        setMessage({
          type: "error",
          text: response.error || "An error occurred.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      <button
        onClick={handleBorrow}
        disabled={isPending}
        className={`px-4 py-2 rounded font-medium text-white transition-colors ${
          isPending
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {isPending ? "Processing..." : "Borrow This Book"}
      </button>

      {message && (
        <p
          className={`text-sm font-semibold p-2 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
