import { signUp } from "@/lib/auth-client";

export async function main() {
  console.log("🌱 Starting Better Auth user seeding...");

  // -------------------------
  // 1. Captain (ADMIN)
  // -------------------------
  const admin = await signUp.email({
    name: "Captain",
    email: "captain@gmail.com",
    password: "captain324",
  });

  console.log("✅ Admin created:", admin);

  // -------------------------
  // 2. Librarian
  // -------------------------
  const librarian = await signUp.email({
    name: "Librarian",
    email: "librarian.l@library.com",
    password: "librarian324",
  });

  console.log("✅ Librarian created:", librarian);

  console.log("🏁 Seeding finished.");
}
