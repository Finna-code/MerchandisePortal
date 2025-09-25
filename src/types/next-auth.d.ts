import { Role } from "@prisma/client";
import NextAuth, { type DefaultSession, User as DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: number;
    role: Role;
    deptId: number | null;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: Role;
    deptId: number | null;
  }
}

