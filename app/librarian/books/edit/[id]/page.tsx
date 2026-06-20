import { EditBookForm } from "@/components/books/EditBookForm";
import { EditBookLayout } from "@/components/books/EditBookLayout";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id: id },
    include: { author: true, copies: true, category: true, ebook: true },
  });

  if (!book) notFound();

  /* -------------------------------------------------------------
     TRANSFORM DB PATHS FOR CLIENT-SIDE RETRIEVAL (UI)
  ------------------------------------------------------------- */
  // Prepends the clean catch-all router stream prefix so the UI renders elements correctly
  const clientCoverUrl = book.coverImage ? `/api/files/${book.coverImage}` : "";
  const clientEbookPath = book.ebook?.filePath
    ? `/api/files/${book.ebook.filePath}`
    : null;

  // Map the Prisma data to the BookPreviewCard props with public route references
  const bookPreviewData = {
    title: book.title,
    description: book.description || "",
    author: book.author?.name || "Unknown Author",
    category: book.category?.name || "Uncategorized",
    isbn: book.isbn || "",
    publicationYear: book.publicationYear?.toString() || "",
    copies: book.copies?.length || 0,
    coverUrl: clientCoverUrl,
    hasEbook: !!book.ebook,
    shelfLocation: book.copies?.[0]?.shelfLocation ?? undefined,
  };

  // Clone and enrich data schema variables specifically for form pre-population hooks
  const enrichedInitialData = {
    ...book,
    coverImage: clientCoverUrl,
    ebook: book.ebook
      ? {
          ...book.ebook,
          filePath: clientEbookPath,
        }
      : null,
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className=" px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 ">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Back Button */}
            <Link
              href="/librarian/books"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Link>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Edit Resource
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ID: {book.id}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 w-fit sm:self-start md:self-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Active Record
          </div>
        </div>

        {/* The Responsive Layout Component */}
        <EditBookLayout bookData={bookPreviewData}>
          <EditBookForm initialData={enrichedInitialData} />
        </EditBookLayout>
      </div>
    </div>
  );
}
