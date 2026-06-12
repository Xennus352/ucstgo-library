import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Defining the seed data strictly typed with Prisma.UserCreateInput
const userData: Prisma.UserCreateInput[] = [
  {
    name: "System Admin",
    email: "admin@library.com",
    password: "secure_password_here", 
    role: "ADMIN",
  },
  {
    name: "Jane Librarian",
    email: "jane.l@library.com",
    password: "secure_password_here",
    role: "LIBRARIAN",
  },
  {
    name: "Alice Smith",
    email: "alice.student@university.com",
    studentId: "STU12345",
    password: "secure_password_here",
    role: "STUDENT",
    faculty: "Computer Science",
    phone: "+1234567890",
  },
  {
    name: "Dr. Bob Ross",
    email: "bob.ross@university.com",
    password: "secure_password_here",
    role: "LECTURER",
    faculty: "Fine Arts",
  }
];

export async function main() {
  console.log("🌱 Starting database seeding...");
  
  for (const u of userData) {
    try {
      const user = await prisma.user.create({ data: u });
      console.log(`Created user: ${user.name} (${user.role})`);
    } catch (error) {
      console.error(`❌ Error creating user ${u.email}:`, error);
    }
  }

  console.log("🏁 Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });