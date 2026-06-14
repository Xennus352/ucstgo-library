export interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  className?: string;
  items?: { title: string; url: string }[];
}