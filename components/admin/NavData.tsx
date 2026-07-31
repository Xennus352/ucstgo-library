import {
  BookOpenIcon,
  DatabaseIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  Settings,
  ShieldCheckIcon,
  UserCheckIcon,
  ActivityIcon,
} from "lucide-react";

export const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Student Management",
      url: "/admin/students",
      icon: <GraduationCapIcon />,
    },
    {
      title: "Librarian Management",
      url: "/admin/librarians",
      icon: <ShieldCheckIcon />,
    },
    {
      title: "Teacher Management",
      url: "/admin/teachers",
      icon: <UserCheckIcon />,
    },
    {
      title: "System Configuration",
      url: "/admin/sys-config",
      icon: <Settings />,
    },
    {
      title: "Monitoring",
      url: "/admin/monitoring",
      icon: <ActivityIcon />,
    },
    {
      title: "Library Management",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        { title: "Books Inventory", url: "/admin/books" },
        { title: "Categories", url: "/admin/catalog/categories" },
        { title: "Authors", url: "/admin/catalog/authors" },
        { title: "Borrowing", url: "/admin/books/borrow-books" },
        { title: "Reservations", url: "/admin/books/reservations" },
        { title: "Password Resets", url: "/admin/password-resets" },
      ],
    },
  ],
};
