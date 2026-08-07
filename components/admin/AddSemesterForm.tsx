"use client";

import { createSemester } from "@/app/actions/semesters";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function AddSemesterForm() {
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const result = await createSemester(name);

    setIsPending(false);

    if (result.success) {
      setName("");
      toast.success("Semester/title added successfully!");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 w-full max-w-full sm:max-w-md"
    >
      {/* min-w-0 prevents the input from causing horizontal flexbox overflow */}
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Year 1 - Semester 1"
        className="w-full flex-1 min-w-0 bg-background text-foreground"
        disabled={isPending}
        required
      />

      <Button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto shrink-0 whitespace-nowrap"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Semester/title"
        )}
      </Button>
    </form>
  );
}
