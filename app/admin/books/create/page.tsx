import CreateBookForm from "@/components/books/create/create-book-form";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Book</h1>
        <p className="text-muted-foreground">
          Add a new book to the library catalog
        </p>
      </div>

      <CreateBookForm />
    </div>
  );
}
