import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials-user",
      name: "User Credentials",
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }
        return null;
      },
    }),
    Credentials({
      id: "credentials-client",
      name: "Client Credentials",
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ phone: z.string(), accessCode: z.string() })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { phone, accessCode } = parsedCredentials.data;
          const client = await prisma.client.findUnique({ where: { phone } });

          if (client && client.accessCode && client.accessCode === accessCode) {
            await prisma.client.update({
              where: { id: client.id },
              data: { accessCode: null },
            });

            return {
              id: client.id,
              name: client.name,
              email: client.email,
              role: "CLIENT",
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
