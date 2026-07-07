"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/routing";

type ReportedSubmission = {
  id: string;
  imageUrl: string;
  score: number;
  reportCount: number;
  hidden: boolean;
  theme: { labelFr: string; labelEn: string };
  user: {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
  };
};

type UserReport = {
  id: string;
  reason: string | null;
  createdAt: string;
  reporter: {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
  };
  reportedUser: {
    id: string;
    username: string | null;
    name: string | null;
    email: string | null;
    score: number;
  };
};

export default function AdminPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { status } = useSession();

  const [items, setItems] = useState<ReportedSubmission[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [pendingUserDelete, setPendingUserDelete] =
    useState<UserReport | null>(null);
  const [userActionBusy, setUserActionBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/reports");

    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    const data = await res.json();

    setItems(data.submissions ?? []);
    setUserReports(data.userReports ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated") load();

    if (status === "unauthenticated") {
      setForbidden(true);
      setLoading(false);
    }
  }, [status]);

  const act = async (submissionId: string, action: "restore" | "delete") => {
    if (action === "delete" && !confirm(t("confirmDelete"))) return;

    setBusy(submissionId);

    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action, locale }),
      });

      setItems((list) => list.filter((item) => item.id !== submissionId));
    } finally {
      setBusy(null);
    }
  };

  const ignoreUserReport = async (reportId: string) => {
    setUserActionBusy(reportId);

    try {
      const res = await fetch("/api/admin/user-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action: "ignore" }),
      });

      if (!res.ok) return;

      setUserReports((list) =>
        list.filter((report) => report.id !== reportId)
      );
    } finally {
      setUserActionBusy(null);
    }
  };

  const deleteReportedAccount = async () => {
    if (!pendingUserDelete) return;

    setUserActionBusy(pendingUserDelete.id);

    try {
      const res = await fetch("/api/admin/user-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: pendingUserDelete.id,
          action: "delete_account",
        }),
      });

      if (!res.ok) return;

      setUserReports((list) =>
        list.filter(
          (report) =>
            report.reportedUser.id !== pendingUserDelete.reportedUser.id
        )
      );

      setPendingUserDelete(null);
    } finally {
      setUserActionBusy(null);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-white/60">…</div>;
  }

  if (forbidden) {
    return (
      <div className="py-24 text-center text-white/60">
        {t("forbidden")}
      </div>
    );
  }

  return (
    <div className="py-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-black uppercase">
          {t("title")}
        </h1>
        <p className="mt-2 text-white/50">{t("subtitle")}</p>
      </header>

      <section>
        <h2 className="mb-4 font-display text-2xl font-black uppercase text-white">
          {t("reportedSubmissions")}
        </h2>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-ink-3 bg-ink-2 p-10 text-center text-white/50">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((submission) => {
              const authorName =
                submission.user.username ??
                submission.user.name ??
                submission.user.email ??
                "—";

              return (
                <div
                  key={submission.id}
                  className="overflow-hidden rounded-2xl border border-ink-3 bg-ink-2"
                >
                  <div className="relative aspect-[16/10] bg-ink">
                    <Image
                      src={submission.imageUrl}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-magenta">
                        {submission.reportCount} {t("reports")}
                      </span>

                      {submission.hidden && (
                        <span className="rounded-full bg-magenta/15 px-2 py-0.5 text-[10px] font-bold uppercase text-magenta">
                          {t("hidden")}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-white/50">
                      {t("theme")}:{" "}
                      {locale === "fr"
                        ? submission.theme.labelFr
                        : submission.theme.labelEn}
                    </p>

                    <p className="text-xs text-white/40">
                      {t("by")}{" "}
                      <Link
                        href={`/profile/${submission.user.id}`}
                        className="text-white/70 hover:text-magenta"
                      >
                        {authorName}
                      </Link>{" "}
                      ({submission.user.email ?? "—"})
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => act(submission.id, "restore")}
                        disabled={busy === submission.id}
                        className="flex-1 rounded-full bg-cyan px-3 py-2 text-sm font-bold text-ink transition enabled:hover:brightness-110 disabled:opacity-40"
                      >
                        {t("restore")}
                      </button>

                      <button
                        onClick={() => act(submission.id, "delete")}
                        disabled={busy === submission.id}
                        className="flex-1 rounded-full bg-magenta px-3 py-2 text-sm font-bold text-ink transition enabled:hover:brightness-110 disabled:opacity-40"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl font-black uppercase text-white">
          {t("reportedProfiles")}
        </h2>

        {userReports.length === 0 ? (
          <p className="rounded-2xl border border-ink-3 bg-ink-2 p-10 text-center text-white/50">
            {t("emptyProfiles")}
          </p>
        ) : (
          <div className="grid gap-4">
            {userReports.map((report) => {
              const reportedName =
                report.reportedUser.username ??
                report.reportedUser.name ??
                report.reportedUser.email ??
                "—";

              const reporterName =
                report.reporter.username ??
                report.reporter.name ??
                report.reporter.email ??
                "—";

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-ink-3 bg-ink-2 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        {t("reportedAccount")}
                      </p>

                      <Link
                        href={`/profile/${report.reportedUser.id}`}
                        className="mt-1 block text-xl font-bold text-white hover:text-magenta"
                      >
                        {reportedName}
                      </Link>

                      <p className="mt-1 text-sm text-white/50">
                        {report.reportedUser.email ?? "—"}
                      </p>

                      <p className="mt-1 text-sm text-white/50">
                        {t("score")}: {report.reportedUser.score} pts
                      </p>

                      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
                        {t("reportedBy")}
                      </p>

                      <Link
                        href={`/profile/${report.reporter.id}`}
                        className="mt-1 block text-sm text-white/70 hover:text-magenta"
                      >
                        {reporterName}
                      </Link>

                      <p className="mt-1 text-xs text-white/40">
                        {report.reporter.email ?? "—"}
                      </p>
                    </div>

                    <div className="text-left text-xs text-white/40 sm:text-right">
                      {new Date(report.createdAt).toLocaleString(
                        locale === "fr" ? "fr-FR" : "en-US"
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {t("reason")}
                    </p>

                    <p className="mt-2 text-sm text-white/80">
                      {report.reason || t("noReason")}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => ignoreUserReport(report.id)}
                      disabled={userActionBusy === report.id}
                      className="flex-1 rounded-full bg-cyan px-3 py-2 text-sm font-bold text-ink transition enabled:hover:brightness-110 disabled:opacity-40"
                    >
                      {t("ignore")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPendingUserDelete(report)}
                      disabled={userActionBusy === report.id}
                      className="flex-1 rounded-full bg-magenta px-3 py-2 text-sm font-bold text-ink transition enabled:hover:brightness-110 disabled:opacity-40"
                    >
                      {t("deleteAccount")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pendingUserDelete && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          onClick={() => setPendingUserDelete(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-8 text-center text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-3xl font-black uppercase">
              {t("deleteAccountTitle")}
            </h2>

            <p className="mt-4 text-sm text-black/60">
              {t("deleteAccountBody")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingUserDelete(null)}
                disabled={userActionBusy === pendingUserDelete.id}
                className="rounded-xl border border-black px-5 py-3 text-base font-medium text-ink transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={deleteReportedAccount}
                disabled={userActionBusy === pendingUserDelete.id}
                className="rounded-xl bg-black px-5 py-3 text-base font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {userActionBusy === pendingUserDelete.id
                  ? t("deletingAccount")
                  : t("confirmDeleteAccount")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}