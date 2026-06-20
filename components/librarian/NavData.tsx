import {
  BookOpenIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  UserCheckIcon,
} from "lucide-react";

export const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/librarian/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Student Management",
      url: "/librarian/students",
      icon: <GraduationCapIcon />,
    },
    {
      title: "Teacher Management",
      url: "/librarian/teachers",
      icon: <UserCheckIcon />,
    },
    {
      title: "Library Management",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        { title: "Books Inventory", url: "/librarian/books" },
        { title: "Borrowing", url: "/librarian/books/borrow-books" },
        { title: "Reservations", url: "/librarian/books/reservations" },
      ],
    },
  ],
};
