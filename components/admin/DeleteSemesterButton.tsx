"use client";

import { deleteSemester } from "@/app/actions/semesters";
import { useTransition } from "react";


interface DeleteSemesterButtonProps {
  semesterId: string;
}

export default function DeleteSemesterButton({ semesterId }: DeleteSemesterButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    // 1. Optional confirmation step for better UX
    const confirmed = confirm("Are you sure you want to delete this semester? This action cannot be undone.");
    if (!confirmed) return;

    // 2. Trigger the Server Action inside a transition
    startTransition(async () => {
      const result = await deleteSemester(semesterId);

      if (!result.success) {
        // Handle error (you could map this to a toast notification library like react-hot-toast or sonner)
        alert(result.error || "Something went wrong.");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}