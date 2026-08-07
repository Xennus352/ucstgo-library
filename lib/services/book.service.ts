import prisma from "@/lib/prisma";
import { notFound, validation, conflict } from "@/lib/errors";
import { getIO } from "@/lib/socket";

export type BookQueryParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  status?: string;
  type?: string;
  semester?: string;
};

export type BookCreateInput = {
  title: string;
  isbn: string;
  authorName: string;
  categoryName: string;
  coverDbPath?: string | null;
  ebookDbPath?: string | null;
  semesterId?: string | null;
  description?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  language?: string;
  donate?: string | null;
  copies?: number;
  shelfLocation?: string | null;
  createdById: string;
  createdByRole?: string;
};

export type BookUpdateInput = Partial<BookCreateInput> & {
  coverImage?: string | null;
  ebookDbPath?: string | null;
};

function buildWhereClause(params: BookQueryParams) {
  const where: any = {};
  const { q, categoryId, status, type, semester } = params;

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { isbn: { contains: q, mode: "insensitive" } },
      { author: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;

  if (status === "available") {
    where.copies = { some: { status: "AVAILABLE" } };
  } else if (status === "borrowed") {
    where.copies = {
      every: { status: "BORROWED" },
      some: { status: "BORROWED" },
    };
  } else if (status === "reserved") {
    where.reservations = { some: { status: "ACTIVE" } };
  }

  if (type === "ebook") {
    where.ebook = {
      isNot: null,
      ...(semester && semester !== "all" ? { semesterId: semester } : {}),
    };
  } else if (type === "physical") {
    where.ebook = null;
    if (!where.copies) where.copies = { some: {} };
  }

  return where;
}

const bookListSelect = {
  id: true,
  isbn: true,
  title: true,
  coverImage: true,
  language: true,
  publicationYear: true,
  donate: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  copies: {
    select: { id: true, barcode: true, shelfLocation: true, status: true },
  },
  ebook: {
    select: {
      id: true,
      format: true,
      filePath: true,
      semesterId: true,
      semester: { select: { id: true, name: true, slug: true } },
    },
  },
  _count: { select: { copies: true, reservations: true } },
};

export async function listBooks(params: BookQueryParams) {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;
  const where = buildWhereClause(params);

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: bookListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  const bookIds = books.map((b: any) => b.id);
  const copyStats = await prisma.bookCopy.groupBy({
    by: ["bookId", "status"],
    where: { bookId: { in: bookIds } },
    _count: { status: true },
  });

  const availabilityMap = new Map<string, Record<string, number>>();
  for (const item of copyStats) {
    const prev = availabilityMap.get(item.bookId) ?? {
      AVAILABLE: 0,
      BORROWED: 0,
      LOST: 0,
      DAMAGED: 0,
    };
    prev[item.status] += item._count.status;
    availabilityMap.set(item.bookId, prev);
  }

  const enriched = books.map((book: any) => {
    const stats = availabilityMap.get(book.id) ?? {
      AVAILABLE: 0,
      BORROWED: 0,
      LOST: 0,
      DAMAGED: 0,
    };
    const available = stats.AVAILABLE;
    const borrowed = stats.BORROWED;
    return {
      ...book,
      coverImage: book.coverImage ? `/api/files/${book.coverImage}` : null,
      ebook: book.ebook
        ? { ...book.ebook, filePath: `/api/files/${book.ebook.filePath}` }
        : null,
      status: available > 0 ? "available" : borrowed > 0 ? "borrowed" : "unavailable",
      availability: {
        available,
        borrowed,
        total: book._count.copies,
        isAvailable: available > 0,
      },
    };
  });

  return {
    data: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getBookById(id: string) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      copies: {
        select: { id: true, barcode: true, shelfLocation: true, status: true },
      },
      ebook: {
        select: {
          id: true,
          format: true,
          filePath: true,
          semesterId: true,
          semester: { select: { id: true, name: true, slug: true } },
        },
      },
      _count: { select: { copies: true, reservations: true } },
    },
  });

  if (!book) throw notFound("Book");

  const stats: Record<string, number> = {
    AVAILABLE: 0, BORROWED: 0, LOST: 0, DAMAGED: 0,
  };
  for (const copy of book.copies) {
    stats[copy.status] = (stats[copy.status] || 0) + 1;
  }
  const available = stats.AVAILABLE;
  const borrowed = stats.BORROWED;

  return {
    ...book,
    coverImage: book.coverImage ? `/api/files/${book.coverImage}` : null,
    ebook: book.ebook
      ? { ...book.ebook, filePath: `/api/files/${book.ebook.filePath}` }
      : null,
    status: available > 0 ? "available" : borrowed > 0 ? "borrowed" : "unavailable",
    availability: {
      available,
      borrowed,
      total: book._count.copies,
      isAvailable: available > 0,
    },
  };
}

export async function getOrCreateAuthor(name: string) {
  const clean = name.trim();
  let author = await prisma.author.findFirst({
    where: { name: { equals: clean, mode: "insensitive" } },
  });
  if (!author) {
    author = await prisma.author.create({ data: { name: clean } });
  }
  return author;
}

export async function getOrCreateCategory(name: string) {
  const clean = name.trim();
  let category = await prisma.category.findFirst({
    where: { name: { equals: clean, mode: "insensitive" } },
  });
  if (!category) {
    category = await prisma.category.create({ data: { name: clean } });
  }
  return category;
}

export function generateBarcode(isbn: string, index: number): string {
  return `${isbn.replace(/-/g, "")}-${String(index + 1).padStart(4, "0")}`;
}

export async function createBook(input: BookCreateInput) {
  const existing = await prisma.book.findUnique({
    where: { isbn: input.isbn },
  });
  if (existing) throw conflict("A book with this ISBN already exists");

  const author = await getOrCreateAuthor(input.authorName);
  const category = await getOrCreateCategory(input.categoryName);

  const book = await prisma.book.create({
    data: {
      title: input.title,
      isbn: input.isbn,
      description: input.description,
      publisher: input.publisher,
      publicationYear: input.publicationYear,
      language: input.language || "English",
      coverImage: input.coverDbPath,
      donate: input.donate,
      categoryId: category.id,
      authorId: author.id,
      createdById: input.createdById,
    },
  });

  if (input.ebookDbPath) {
    await prisma.ebook.create({
      data: {
        bookId: book.id,
        filePath: input.ebookDbPath,
        format: "PDF",
        accessType: input.createdByRole === "LECTURER" ? "LECTURER_ONLY" : "OPEN",
        semesterId: input.semesterId || null,
      },
    });
  }

  const copiesCount = input.copies || 1;
  await prisma.bookCopy.createMany({
    data: Array.from({ length: copiesCount }).map((_, i) => ({
      bookId: book.id,
      barcode: generateBarcode(input.isbn, i),
      status: "AVAILABLE",
      shelfLocation: input.shelfLocation || null,
    })),
  });

  try {
    const io = getIO();
    if (io) {
      io.emit("catalog:created", book);
      console.log("[socket] Emitted catalog:created", book.id);
    } else {
      console.warn("[socket] getIO() returned undefined, cannot emit");
    }
  } catch {
    console.error("[socket] Error emitting catalog:created");
  }

  return book;
}

export async function updateBook(
  id: string,
  input: BookUpdateInput,
  userId: string,
) {
  const existing = await prisma.book.findUnique({
    where: { id },
    include: { ebook: true },
  });
  if (!existing) throw notFound("Book");

  const isLecturer = input.createdByRole === "LECTURER";
  if (isLecturer && existing.createdById !== userId) {
    throw validation("Lecturers can only edit their own books");
  }

  const author = input.authorName
    ? await getOrCreateAuthor(input.authorName)
    : null;
  const category = input.categoryName
    ? await getOrCreateCategory(input.categoryName)
    : null;

  const updated = await prisma.book.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.isbn !== undefined && { isbn: input.isbn }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.publisher !== undefined && { publisher: input.publisher }),
      ...(input.publicationYear !== undefined && { publicationYear: input.publicationYear }),
      ...(input.language !== undefined && { language: input.language }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
      ...(input.donate !== undefined && { donate: input.donate }),
      ...(author && { authorId: author.id }),
      ...(category && { categoryId: category.id }),
    },
    include: {
      author: true,
      category: true,
      ebook: { include: { semester: true } },
    },
  });

  if (input.ebookDbPath !== undefined) {
    await prisma.ebook.upsert({
      where: { bookId: id },
      create: {
        bookId: id,
        filePath: input.ebookDbPath,
        format: "PDF",
        semesterId: input.semesterId || null,
      },
      update: {
        filePath: input.ebookDbPath,
        semesterId: input.semesterId || null,
      },
    });
  } else if (input.semesterId !== undefined) {
    await prisma.ebook.updateMany({
      where: { bookId: id },
      data: { semesterId: input.semesterId },
    });
  }

  try { getIO()?.emit("catalog:updated", updated); } catch {}

  return updated;
}

export async function deleteBook(id: string) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: { ebook: true },
  });
  if (!book) throw notFound("Book");

  await prisma.$transaction([
    prisma.bookCopy.deleteMany({ where: { bookId: id } }),
    prisma.ebook.deleteMany({ where: { bookId: id } }),
    prisma.book.delete({ where: { id } }),
  ]);

  try {
    const io = getIO();
    if (io) {
      io.emit("catalog:deleted", { id });
      console.log("[socket] Emitted catalog:deleted", id);
    } else {
      console.warn("[socket] getIO() returned undefined, cannot emit catalog:deleted");
    }
  } catch {
    console.error("[socket] Error emitting catalog:deleted");
  }

  return { coverImage: book.coverImage, ebookPath: book.ebook?.filePath ?? null };
}

export async function getLecturerBooks(userId: string) {
  const books = await prisma.book.findMany({
    where: { createdById: userId },
    include: {
      author: true,
      category: true,
      copies: true,
      ebook: true,
      _count: { select: { copies: true, reservations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return books.map((book: any) => ({
    ...book,
    coverImage: book.coverImage ? `/api/files/${book.coverImage}` : null,
    ebook: book.ebook
      ? { ...book.ebook, filePath: `/api/files/${book.ebook.filePath}` }
      : null,
  }));
}
