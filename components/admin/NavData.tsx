import {
  BookOpenIcon,
  DatabaseIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  Settings,
  ShieldCheckIcon,
  UserCheckIcon,
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
      title: "admin Management",
      url: "/admin/admins",
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
      title: "Library Management",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        { title: "Books Inventory", url: "/admin/books" },
        { title: "Borrowing", url: "/admin/books/borrow-books" },
        { title: "Reservations", url: "/admin/books/reservations" },
      ],
    },
  ],
};
