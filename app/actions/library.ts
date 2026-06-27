"use server";

import prisma from "@/lib/prisma";
export async function getLatestBooks() {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: "desc", // Grabs the newest entries first
      },
      take: 3, // Returns exactly the number of cards
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    // Map the database structure into the Book shape your frontend interface uses
    const formattedBooks = books.map((book) => ({
      title: book.title,
      author: book.author.name,
      year: book.publicationYear ? String(book.publicationYear) : "N/A",
      imageUrl:
        book.coverImage ||
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=500&fit=crop", // Safe UI fallback image
    }));

    return { success: true, books: formattedBooks };
  } catch (error) {
    console.error("Database query failed for latest books:", error);
    return {
      success: false,
      books: [],
      error: "Could not retrieve latest arrivals",
    };
  }
}
