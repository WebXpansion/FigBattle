"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useTranslations } from "next-intl";

// Overlay 3D : affiche un modèle GLB avec rotation à la souris/au doigt
// (via <model-viewer>, le web component officiel de Google), et permet
// d'exporter une capture PNG à fond transparent.
export function GlbViewerOverlay({
  glbUrl,
  onClose,
}: {
  glbUrl: string;
  onClose: () => void;
}) {
  const t = useTranslations("play");
  const viewerRef = useRef<HTMLElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleScreenshot = () => {
    const viewer = viewerRef.current as HTMLElement & {
      toDataURL: (type?: string) => string;
    };
    if (!viewer || typeof viewer.toDataURL !== "function") return;

    // PNG à fond transparent : model-viewer ne peint pas de fond opaque
    // tant qu'aucun skybox/environment-image n'est défini.
    const dataUrl = viewer.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "figbattle-3d-model.png";
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-xl"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3/dist/model-viewer.min.js"
        onReady={() => setScriptReady(true)}
      />

      <button
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label={t("close")}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className="relative h-[75vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {scriptReady && (
          <model-viewer
            ref={viewerRef as React.RefObject<HTMLElement>}
            src={glbUrl}
            camera-controls
            exposure="1"
            shadow-intensity="0.6"
            style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
            onLoad={() => setLoading(false)}
          />
        )}

        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="animate-pulse text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              {t("loadingModel")}
            </p>
          </div>
        )}

        <button
          onClick={handleScreenshot}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-2xl bg-white px-6 py-3 font-display text-sm font-black uppercase text-ink transition hover:bg-white/90"
        >
          {t("screenshot")}
        </button>
      </div>
    </div>
  );
}