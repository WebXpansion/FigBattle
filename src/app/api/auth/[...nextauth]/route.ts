import { handlers } from "@/lib/auth";

// Expose les endpoints Auth.js (signin, callback Discord, signout…).
export const { GET, POST } = handlers;
