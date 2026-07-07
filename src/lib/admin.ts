import { auth } from "@/lib/auth";

// Liste des emails admin depuis l'env (séparés par des virgules).
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Vérifie que la session courante est un admin. Retourne l'email ou null.
export async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return adminEmails().includes(email) ? email : null;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}