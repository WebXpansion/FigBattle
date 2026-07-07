// Contraintes d'upload partagées client + serveur (source unique).
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 Mo
export const ALLOWED_IMAGE_EXT = ["png", "jpg", "jpeg", "webp"] as const;
export const ALLOWED_IMAGE_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AllowedExt = (typeof ALLOWED_IMAGE_EXT)[number];

export function isAllowedExt(ext: string): boolean {
  return (ALLOWED_IMAGE_EXT as readonly string[]).includes(ext.toLowerCase());
}
