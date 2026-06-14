import Link from "next/link";

export default function BooksPage() {
  return (
    <div className="px-4 lg:px-6">
      <h2 className="text-2xl font-bold tracking-tight">Books Catalog</h2>
      <p className="text-muted-foreground mt-2">
        Browse, search, or add items to the current library collection.
      </p>

      <Link href="/admin/books/create">Create new book</Link>

      {/* <BooksStats />
      <BooksToolbar />
      <BooksTable /> */}
    </div>
  );
}
