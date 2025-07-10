import "next-auth";

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "ADMIN" | "EMPLOYEE" | "CLIENT";
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "ADMIN" | "EMPLOYEE" | "CLIENT";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "EMPLOYEE" | "CLIENT";
  }
}
