import { createClient } from "@supabase/supabase-js";

// Client serveur avec la service role key : utilisé pour générer des URLs
// d'upload signées et écrire dans le bucket. NE JAMAIS importer côté client.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "submissions";
