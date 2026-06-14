import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// for books management 
export const getUploadPath = (fileName: string) => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Returns: "2026/06/12345-my-book.png"
  return `${year}/${month}/${Date.now()}-${fileName.replace(/\s+/g, '-').toLowerCase()}`;
};