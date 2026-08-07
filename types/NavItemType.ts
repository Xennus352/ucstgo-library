export interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  className?: string;
  badge?: React.ReactNode;
  items?: { title: string; url: string }[];
}