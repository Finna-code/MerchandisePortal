// src/auth.ts
import NextAuth, { type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { type Role } from "@prisma/client";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./lib/db";
import bcrypt from "bcryptjs";

const credentialsSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password cannot be empty"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = credentialsSchema.parse(credentials);
          const user = await prisma.user.findUnique({ where: { email } });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }
          
          return user;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Ensure id is always a number
        token.id = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
        token.role = user.role;
        token.deptId = user.deptId;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.deptId = token.deptId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
});