import { Role } from "@/types/Role"; 

export interface AuthenticatedUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role: Role | string; 
}