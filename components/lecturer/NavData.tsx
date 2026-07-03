import { BookText, CircleUser, Plus, SquareLibrary } from "lucide-react";

export const navData = {
  navMain: [
    {
      title: "Ebooks",
      url: "/lecturer/ebooks",
      icon: <BookText />,
    },
{
      title: "Manage E Resources",
      url: "/lecturer/manage-ebooks",
      icon: <Plus />,
    },
    {
      title: "Physical Books",
      url: "/lecturer/books",
      icon: <SquareLibrary />,
    },
    {
      title: "Profile",
      url: "/lecturer/profile",
      icon: <CircleUser />,
    },
  ],
};
