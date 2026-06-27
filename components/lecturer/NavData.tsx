import {
  BookText,
  CircleUser,
  Home,
  SquareLibrary,
  
} from "lucide-react";

export const navData = {
  navMain: [
    {
      title: "Home",
      url: "/lecturer/home",
      icon: <Home />,
    },
    {
      title: "Ebooks",
      url: "/lecturer/ebooks",
      icon: <BookText />,
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
