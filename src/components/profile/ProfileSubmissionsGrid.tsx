"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/routing";

type Submission = {
  id: string;
  imageUrl: string;
  score: number;
  voteCount: number;
  themeLabel: string;
};

export function ProfileSubmissionsGrid({
  submissions,
  isOwner,
}: {
  submissions: Submission[];
  isOwner: boolean;
}) {
  const t = useTranslations("profileSubmissions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState(submissions);
  const [opened, setOpened] = useState<Submission | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Submission | null>(null);
  const [pendingReport, setPendingReport] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(submissions);
  }, [submissions]);

  // Ouvre automatiquement le rendu en plein écran si l'URL contient
  // ?submission=<id> — c'est ce qui permet à un lien partagé de rouvrir
  // directement la photo, comme si on avait cliqué dessus.
  useEffect(() => {
    const targetId = searchParams.get("submission");
    if (!targetId) return;
    const match = items.find((s) => s.id === targetId);
    if (match) setOpened(match);
  }, [searchParams, items]);

  useEffect(() => {
    if (!opened) return;

    const container = scrollRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (maxScroll <= 0) return;

      container.scrollTop = maxScroll;

      setTimeout(() => {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 250);
    });

    return () => cancelAnimationFrame(frame);
  }, [opened]);

  const shareSubmission = async (submission: Submission) => {
    // Lien vers CETTE page (profil) avec l'id du rendu en query param —
    // pas l'URL brute de l'image. C'est ce qui permet de rouvrir la photo
    // en plein écran automatiquement quand quelqu'un ouvre le lien partagé.
    const url = new URL(window.location.href);
    url.searchParams.set("submission", submission.id);
    const shareUrl = url.toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: submission.themeLabel,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // L'utilisateur peut annuler le partage natif, donc on ne bloque pas l'UI.
    }
  };

  const closeModal = () => {
    setOpened(null);
    // Nettoie ?submission= de l'URL sans recharger la page, pour éviter
    // qu'un refresh ne rouvre la modale toute seule après fermeture.
    const url = new URL(window.location.href);
    url.searchParams.delete("submission");
    window.history.replaceState(null, "", url.toString());
  };

  const deleteSubmission = async () => {
    if (!pendingDelete || deleting) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/submissions/${pendingDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("delete_failed");
      }

      setItems((current) =>
        current.filter((item) => item.id !== pendingDelete.id)
      );

      if (opened?.id === pendingDelete.id) {
        setOpened(null);
      }

      setPendingDelete(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const reportSubmission = async () => {
    if (!pendingReport || reporting) return;

    setReporting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: pendingReport.id }),
      });

      if (!res.ok && res.status !== 409) {
        throw new Error("report_failed");
      }

      setPendingReport(null);
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((submission) => (
          <article
            key={submission.id}
            className="overflow-hidden rounded-xl bg-black/[0.04] p-5 text-left transition hover:bg-black/[0.06]"
          >
            <h3 className="mb-4 text-base font-medium leading-tight text-ink">
              {submission.themeLabel}
            </h3>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-black/5 px-2 py-2 sm:px-5">
                <p className="text-xs text-black/35 sm:text-xs">
                  {t("scoreLabel")}
                </p>
                <p className="text-2xl font-medium text-ink sm:text-2xl">
                  {submission.score}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-black/5 px-2 py-2 sm:px-5">
                <p className="text-xs text-black/35 sm:text-xs">
                  {t("votesLabel")}
                </p>
                <p className="text-2xl font-medium text-ink sm:text-2xl">
                  {submission.voteCount}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpened(submission)}
              className="relative block aspect-[16/10] w-full overflow-hidden rounded-lg bg-black/10"
            >
              <Image
                src={submission.imageUrl}
                alt={submission.themeLabel}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 25vw"
                unoptimized
              />
            </button>

            <div
              className={`mt-6 grid gap-3 ${
                isOwner ? "grid-cols-2" : "grid-cols-[64px_1fr]"
              }`}
            >
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setPendingDelete(submission)}
                  className="rounded-xl border border-black bg-white px-5 py-3 text-sm font-medium text-ink transition hover:bg-black hover:text-white"
                >
                  {t("delete")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingReport(submission)}
                  className="flex items-center justify-center rounded-xl border border-black bg-white px-3 py-3 text-ink transition hover:bg-black hover:text-white"
                  aria-label={t("report")}
                >
                  <WarningIcon />
                </button>
              )}

              <button
                type="button"
                onClick={() => shareSubmission(submission)}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/80"
              >
                {t("share")}
              </button>
            </div>
          </article>
        ))}
      </div>

      {opened && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 p-6 backdrop-blur-md"
          onClick={closeModal}
        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-6 top-6 z-20 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink shadow-lg transition hover:bg-white/90"
          >
            × {t("close")}
          </button>

          <div
            ref={scrollRef}
            className="relative max-h-[82dvh] w-full max-w-6xl overflow-y-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={opened.imageUrl}
              alt={opened.themeLabel}
              className="mx-auto h-auto w-full max-w-none rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {copied && (
        <div className="fixed inset-x-0 bottom-8 z-[70] flex justify-center">
          <div className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white shadow-2xl">
            {t("linkCopied")}
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-8 text-center text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-3xl font-black uppercase">
              {t("deleteTitle")}
            </h2>

            <p className="mt-4 text-sm text-black/60">{t("deleteBody")}</p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={deleteSubmission}
                disabled={deleting}
                className="rounded-xl bg-black px-5 py-3 text-base font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("delete")}
              </button>

              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-black px-5 py-3 text-base font-medium text-ink transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingReport && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          onClick={() => setPendingReport(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-8 text-center text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-3xl font-black uppercase">
              {t("reportTitle")}
            </h2>

            <p className="mt-4 text-sm text-black/60">{t("reportBody")}</p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingReport(null)}
                disabled={reporting}
                className="rounded-xl border border-black px-5 py-3 text-base font-medium text-ink transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={reportSubmission}
                disabled={reporting}
                className="rounded-xl bg-black px-5 py-3 text-base font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {reporting ? t("reporting") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WarningIcon() {
  return (
    <svg
      width="28"
      height="25"
      viewBox="0 0 28 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path
        d="M27.5687 20.1442L16.8218 1.62633C16.5371 1.13217 16.1262 0.721543 15.6307 0.435968C15.1353 0.150393 14.5727 0 14 0C13.4273 0 12.8647 0.150393 12.3693 0.435968C11.8738 0.721543 11.4629 1.13217 11.1782 1.62633L0.431291 20.1442C0.147601 20.6368 -0.00111347 21.1948 6.27683e-06 21.7625C0.00112602 22.3302 0.152041 22.8877 0.437672 23.3792C0.723303 23.8707 1.13365 24.2791 1.6277 24.5635C2.12176 24.8479 2.68223 24.9984 3.2531 25H24.7469C25.3178 24.9984 25.8782 24.8479 26.3723 24.5635C26.8664 24.2791 27.2767 23.8707 27.5623 23.3792C27.848 22.8877 27.9989 22.3302 28 21.7625C28.0011 21.1948 27.8524 20.6368 27.5687 20.1442ZM25.8376 22.383C25.7294 22.5755 25.571 22.7354 25.379 22.8457C25.187 22.9561 24.9686 23.0128 24.7469 23.0099H3.2531C3.03137 23.0128 2.81297 22.9561 2.62098 22.8457C2.429 22.7354 2.27055 22.5755 2.1624 22.383C2.0496 22.195 1.99004 21.9801 1.99004 21.7611C1.99004 21.5422 2.0496 21.3273 2.1624 21.1392L12.9193 2.62137C13.0274 2.43092 13.1844 2.27243 13.3743 2.16215C13.5641 2.05187 13.7801 1.99376 14 1.99376C14.2199 1.99376 14.4359 2.05187 14.6257 2.16215C14.8156 2.27243 14.9726 2.43092 15.0807 2.62137L25.8376 21.1392C25.9504 21.3273 26.01 21.5422 26.01 21.7611C26.01 21.9801 25.9504 22.195 25.8376 22.383ZM12.9994 15.8456V7.43741C12.9994 7.1735 13.1048 6.92041 13.2924 6.7338C13.4801 6.54719 13.7346 6.44236 14 6.44236C14.2654 6.44236 14.5199 6.54719 14.7076 6.7338C14.8952 6.92041 15.0006 7.1735 15.0006 7.43741V15.8456C15.0006 16.1095 14.8952 16.3626 14.7076 16.5492C14.5199 16.7358 14.2654 16.8406 14 16.8406C13.7346 16.8406 13.4801 16.7358 13.2924 16.5492C13.1048 16.3626 12.9994 16.1095 12.9994 15.8456ZM15.531 19.5272C15.531 19.8283 15.4412 20.1227 15.273 20.3731C15.1047 20.6234 14.8656 20.8185 14.5859 20.9338C14.3061 21.049 13.9983 21.0792 13.7013 21.0204C13.4043 20.9617 13.1315 20.8167 12.9174 20.6038C12.7033 20.3908 12.5575 20.1196 12.4984 19.8242C12.4394 19.5289 12.4697 19.2228 12.5856 18.9446C12.7014 18.6664 12.8977 18.4287 13.1494 18.2614C13.4012 18.0941 13.6972 18.0048 14 18.0048C14.4052 18.0074 14.7931 18.1687 15.0797 18.4536C15.3662 18.7386 15.5284 19.1243 15.531 19.5272Z"
        fill="currentColor"
      />
    </svg>
  );
}