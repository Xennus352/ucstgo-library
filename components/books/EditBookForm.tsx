"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookFormFields } from "./BookFormField";

export function EditBookForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const routePath = usePathname();

  const [rawCoverFile, setRawCoverFile] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  // -----------------------------
  // FORM STATE
  // -----------------------------
  const [form, setForm] = useState({
    title: "",
    isbn: "",
    author: "",
    category: "",
    publisher: "",
    description: "",
    publicationYear: "",
    language: "",
  });

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [ebook, setEbook] = useState<File | null>(null);

  const [copies, setCopies] = useState<number>(0);
  const [shelfLocation, setShelfLocation] = useState<string>("");
  const isLibrarian = routePath.startsWith("/librarian");
  const basePath = isLibrarian ? "/librarian/books" : "/admin/books";
  // -----------------------------
  // SYNC INITIAL DATA (IMPORTANT FIX)
  // -----------------------------
  useEffect(() => {
    if (!initialData) return;

    setForm({
      title: initialData.title ?? "",
      isbn: initialData.isbn ?? "",
      author: initialData.author?.name ?? "",
      category: initialData.category?.name ?? "",
      publisher: initialData.publisher ?? "",
      description: initialData.description ?? "",
      publicationYear: initialData.publicationYear?.toString() ?? "",
      language: initialData.language ?? "",
    });

    setCoverPreview(initialData.coverImage ?? null);

    setCopies(initialData._count?.copies ?? initialData.copies?.length ?? 0);

    setShelfLocation(
      initialData.copies?.find((c: any) => c?.shelfLocation)?.shelfLocation ??
        initialData.copies?.[0]?.shelfLocation ??
        "",
    );
  }, [initialData]);

  // -----------------------------
  // COVER HANDLER
  // -----------------------------
  const handleCoverChange = (file: File | null) => {
    if (file) {
      setRawCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setRawCoverFile(null);
      setCoverPreview(initialData.coverImage ?? null);
    }
  };

  // -----------------------------
  // SUBMIT
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value ?? ""));
      });

      formData.append("copies", String(copies));
      formData.append("shelfLocation", shelfLocation);

      if (rawCoverFile) {
        formData.append("cover", rawCoverFile);
      }

      const response = await fetch(`/api/books/${initialData.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        router.push(basePath);
        router.refresh();
      } else {
        console.error("Update failed");
        setIsPending(false);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BookFormFields
        form={form}
        setForm={setForm}
        coverPreview={coverPreview}
        handleCoverChange={handleCoverChange}
        ebook={ebook}
        setEbook={setEbook}
        copies={copies}
        setCopies={setCopies}
        shelfLocation={shelfLocation}
        setShelfLocation={setShelfLocation}
      />

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Book"}
        </Button>
      </div>
    </form>
  );
}
