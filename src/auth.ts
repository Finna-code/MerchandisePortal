// src/auth.ts
import NextAuth, { type Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "./lib/db";
import bcrypt from "bcryptjs";

type UserRole = "user" | "dept_head" | "admin";

const ALLOW_UNVERIFIED_LOGIN = process.env.ALLOW_UNVERIFIED_LOGIN === "true";

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
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error(parsed.error.issues?.[0]?.message ?? "Invalid credentials");
        }

        const { email, password } = parsed.data;
        const user = (await prisma.user.findUnique({ where: { email } })) as ({
          id: number;
          name: string | null;
          email: string;
          passwordHash: string;
          role: UserRole;
          deptId: number | null;
          createdAt: Date;
          emailVerifiedAt: Date | null;
        }) | null;
        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        if (!ALLOW_UNVERIFIED_LOGIN && !user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Ensure id is always a number
        token.id = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
        token.deptId = user.deptId;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id;
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











