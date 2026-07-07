import { DefaultSession } from "next-auth";

// Étend le type de session pour inclure id + score + username.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      score: number;
      username?: string | null;
    } & DefaultSession["user"];
  }
}