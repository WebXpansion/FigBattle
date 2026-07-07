import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

// Âge minimum (ms) avant qu'un fichier sans submission soit considéré orphelin.
// 2h = très au-delà d'une partie (10 min max), donc aucun risque de supprimer
// un upload en cours de soumission.
const ORPHAN_MIN_AGE_MS = 2 * 60 * 60 * 1000;

// Nombre de fichiers listés par page Supabase (max 1000 par appel).
const PAGE_SIZE = 1000;

export type CleanupResult = {
  scanned: number; // fichiers parcourus dans le bucket
  deleted: number; // orphelins supprimés
  kept: number; // fichiers conservés (récents ou référencés)
};

// Extrait le chemin de stockage ("userId/uuid.png") depuis une URL publique.
function storagePathFromUrl(imageUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(imageUrl.substring(idx + marker.length));
  } catch {
    return null;
  }
}

// Liste récursivement tous les fichiers du bucket.
// Les uploads sont rangés par dossier utilisateur ("userId/fichier.png"),
// donc on liste d'abord les dossiers, puis les fichiers de chaque dossier.
async function listAllFiles(): Promise<
  { path: string; createdAt: number }[]
> {
  const out: { path: string; createdAt: number }[] = [];

  // 1) Dossiers de premier niveau (un par utilisateur).
  const folders: string[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list("", { limit: PAGE_SIZE, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    // Un "dossier" n'a pas de metadata (pas de taille) ; un fichier en a une.
    for (const entry of data) {
      if (!entry.metadata) folders.push(entry.name);
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // 2) Fichiers dans chaque dossier utilisateur.
  for (const folder of folders) {
    let folderOffset = 0;
    for (;;) {
      const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .list(folder, { limit: PAGE_SIZE, offset: folderOffset });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        if (!entry.metadata) continue; // sous-dossier éventuel, on ignore
        const created = entry.created_at
          ? new Date(entry.created_at).getTime()
          : 0;
        out.push({ path: `${folder}/${entry.name}`, createdAt: created });
      }
      if (data.length < PAGE_SIZE) break;
      folderOffset += PAGE_SIZE;
    }
  }

  return out;
}

// Supprime du bucket les fichiers orphelins (assez vieux + sans submission).
export async function cleanupOrphanFiles(): Promise<CleanupResult> {
  const now = Date.now();
  const all = await listAllFiles();

  // On ne considère que les fichiers assez vieux (hors fenêtre de sécurité).
  const oldEnough = all.filter(
    (f) => now - f.createdAt >= ORPHAN_MIN_AGE_MS
  );

  const result: CleanupResult = {
    scanned: all.length,
    deleted: 0,
    kept: all.length,
  };

  if (oldEnough.length === 0) return result;

  // Récupère tous les chemins RÉELLEMENT référencés par une submission,
  // parmi les candidats seulement (requête bornée, pas toute la table).
  // On reconstruit l'ensemble des imageUrl existantes pour comparer.
  const submissions = await prisma.submission.findMany({
    select: { imageUrl: true },
  });
  const referenced = new Set<string>();
  for (const s of submissions) {
    const p = storagePathFromUrl(s.imageUrl);
    if (p) referenced.add(p);
  }

  const orphanPaths = oldEnough
    .map((f) => f.path)
    .filter((p) => !referenced.has(p));

  if (orphanPaths.length === 0) return result;

  // Supabase supprime jusqu'à 1000 chemins par appel : on découpe par lots.
  for (let i = 0; i < orphanPaths.length; i += 1000) {
    const batch = orphanPaths.slice(i, i + 1000);
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove(batch);
    if (error) throw error;
    result.deleted += batch.length;
  }

  result.kept = all.length - result.deleted;
  return result;
}