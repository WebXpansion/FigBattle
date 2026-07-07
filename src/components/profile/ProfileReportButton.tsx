"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ProfileReportButton({
  reportedUserId,
}: {
  reportedUserId: string;
}) {
  const t = useTranslations("profileReport");

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (sending) return;

    setSending(true);

    try {
      const res = await fetch("/api/user-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: reportedUserId, reason }),
      });

      if (!res.ok && res.status !== 409) {
        throw new Error("report_failed");
      }

      setOpen(false);
      setReason("");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/70 backdrop-blur-md transition hover:bg-white hover:text-ink"
        aria-label={t("button")}
      >
        <WarningIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-8 text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-3xl font-black uppercase">
              {t("title")}
            </h2>

            <p className="mt-3 text-sm text-black/60">{t("body")}</p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder={t("placeholder")}
              className="mt-6 min-h-[120px] w-full resize-none rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
            />

            <div className="mt-2 text-right text-xs text-black/40">
              {reason.length}/200
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="rounded-xl border border-black px-5 py-3 text-base font-medium text-ink transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="rounded-xl bg-black px-5 py-3 text-base font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {sending ? t("sending") : t("send")}
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
      className="h-4 w-4"
    >
      <path
        d="M27.5687 20.1442L16.8218 1.62633C16.5371 1.13217 16.1262 0.721543 15.6307 0.435968C15.1353 0.150393 14.5727 0 14 0C13.4273 0 12.8647 0.150393 12.3693 0.435968C11.8738 0.721543 11.4629 1.13217 11.1782 1.62633L0.431291 20.1442C0.147601 20.6368 -0.00111347 21.1948 6.27683e-06 21.7625C0.00112602 22.3302 0.152041 22.8877 0.437672 23.3792C0.723303 23.8707 1.13365 24.2791 1.6277 24.5635C2.12176 24.8479 2.68223 24.9984 3.2531 25H24.7469C25.3178 24.9984 25.8782 24.8479 26.3723 24.5635C26.8664 24.2791 27.2767 23.8707 27.5623 23.3792C27.848 22.8877 27.9989 22.3302 28 21.7625C28.0011 21.1948 27.8524 20.6368 27.5687 20.1442ZM25.8376 22.383C25.7294 22.5755 25.571 22.7354 25.379 22.8457C25.187 22.9561 24.9686 23.0128 24.7469 23.0099H3.2531C3.03137 23.0128 2.81297 22.9561 2.62098 22.8457C2.429 22.7354 2.27055 22.5755 2.1624 22.383C2.0496 22.195 1.99004 21.9801 1.99004 21.7611C1.99004 21.5422 2.0496 21.3273 2.1624 21.1392L12.9193 2.62137C13.0274 2.43092 13.1844 2.27243 13.3743 2.16215C13.5641 2.05187 13.7801 1.99376 14 1.99376C14.2199 1.99376 14.4359 2.05187 14.6257 2.16215C14.8156 2.27243 14.9726 2.43092 15.0807 2.62137L25.8376 21.1392C25.9504 21.3273 26.01 21.5422 26.01 21.7611C26.01 21.9801 25.9504 22.195 25.8376 22.383ZM12.9994 15.8456V7.43741C12.9994 7.1735 13.1048 6.92041 13.2924 6.7338C13.4801 6.54719 13.7346 6.44236 14 6.44236C14.2654 6.44236 14.5199 6.54719 14.7076 6.7338C14.8952 6.92041 15.0006 7.1735 15.0006 7.43741V15.8456C15.0006 16.1095 14.8952 16.3626 14.7076 16.5492C14.5199 16.7358 14.2654 16.8406 14 16.8406C13.7346 16.8406 13.4801 16.7358 13.2924 16.5492C13.1048 16.3626 12.9994 16.1095 12.9994 15.8456ZM15.531 19.5272C15.531 19.8283 15.4412 20.1227 15.273 20.3731C15.1047 20.6234 14.8656 20.8185 14.5859 20.9338C14.3061 21.049 13.9983 21.0792 13.7013 21.0204C13.4043 20.9617 13.1315 20.8167 12.9174 20.6038C12.7033 20.3908 12.5575 20.1196 12.4984 19.8242C12.4394 19.5289 12.4697 19.2228 12.5856 18.9446C12.7014 18.6664 12.8977 18.4287 13.1494 18.2614C13.4012 18.0941 13.6972 18.0048 14 18.0048C14.4052 18.0074 14.7931 18.1687 15.0797 18.4536C15.3662 18.7386 15.5284 19.1243 15.531 19.5272Z"
        fill="currentColor"
      />
    </svg>
  );
}