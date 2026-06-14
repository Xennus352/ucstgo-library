"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function CreateBookForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    isbn: "",
    author: "",
    category: "",
  });

  const [cover, setCover] = useState<File | null>(null);
  const [ebook, setEbook] = useState<File | null>(null);
  const [copies, setCopies] = useState(1);

  const handleSubmit = () => {
    if (!form.title || !form.isbn || !form.author || !form.category) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!cover) {
      toast.error("Cover image is required");
      return;
    }

    const fd = new FormData();

    fd.append("title", form.title);
    fd.append("isbn", form.isbn);
    fd.append("author", form.author);
    fd.append("category", form.category);
    fd.append("copies", String(copies));

    fd.append("cover", cover);
    if (ebook) fd.append("ebook", ebook);

    startTransition(async () => {
      try {
        const res = await fetch("/api/books", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to create book");
          return;
        }

        toast.success("Book created successfully");
        router.push("/admin/books");
      } catch (err) {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* BASIC INFO */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold">Book Details</h2>

        <Input
          placeholder="Book Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <Input
          placeholder="ISBN"
          value={form.isbn}
          onChange={(e) => setForm({ ...form, isbn: e.target.value })}
        />

        {/* AUTHOR INPUT (AUTO CREATE) */}
        <Input
          placeholder="Author name (auto-create if new)"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
        />

        {/* CATEGORY INPUT (AUTO CREATE) */}
        <Input
          placeholder="Category (auto-create if new)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
      </Card>

      {/* FILE UPLOAD */}
      <Card className="p-5 space-y-4">
        <h2 className="text-lg font-semibold">Uploads</h2>

        <div>
          <label className="text-sm font-medium">Cover Image *</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Ebook (optional)</label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setEbook(e.target.files?.[0] || null)}
          />
        </div>
      </Card>
      id isbn title description publisher publication year language cover image categoryid authorid createdat

      {/* COPIES */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">Physical Copies</h2>

        <Input
          type="number"
          min={1}
          value={copies}
          onChange={(e) => setCopies(Number(e.target.value))}
        />
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/books")}>
          Cancel
        </Button>

        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Creating..." : "Create Book"}
        </Button>
      </div>
    </div>
  );
}
