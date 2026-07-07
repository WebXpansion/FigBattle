"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";

export function ProfileLogoutButton() {
  const t = useTranslations("profileLogout");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const logout = async () => {
    if (leaving) return;

    setLeaving(true);

    await signOut({
      callbackUrl: `/${locale}`,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/70 backdrop-blur-md transition hover:bg-white hover:text-ink"        aria-label={t("button")}
      >
        <LogoutIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-8 text-center text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-3xl font-black uppercase">
              {t("title")}
            </h2>

            <p className="mt-4 text-sm text-black/60">
              {t("body")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={leaving}
                className="rounded-xl border border-black px-5 py-3 text-base font-medium text-ink transition hover:bg-black hover:text-white disabled:opacity-50"
              >
                {t("cancel")}
              </button>

              <button
                type="button"
                onClick={logout}
                disabled={leaving}
                className="rounded-xl bg-black px-5 py-3 text-base font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
              >
                {leaving ? t("leaving") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path
        d="M15.83 17.24V19.05C15.83 20.13 14.93 21 13.83 21H2C0.9 21 0 20.12 0 19.05V1.95C0 0.87 0.9 0 2 0H13.83C14.93 0 15.83 0.88 15.83 1.95V3.76C15.83 4.31 15.38 4.76 14.83 4.76C14.28 4.76 13.83 4.31 13.83 3.76V1.95L2 2V19.05L13.82 19V17.24C13.82 16.69 14.27 16.24 14.82 16.24C15.37 16.24 15.82 16.69 15.82 17.24H15.83ZM20.75 9.84L17.79 6.45C17.43 6.03 16.8 5.99 16.38 6.35C15.96 6.71 15.92 7.34 16.28 7.76L17.79 9.5H9.99C9.44 9.5 8.99 9.95 8.99 10.5C8.99 11.05 9.44 11.5 9.99 11.5H17.79L16.28 13.24C15.92 13.66 15.96 14.29 16.38 14.65C16.57 14.82 16.8 14.9 17.04 14.9C17.32 14.9 17.6 14.78 17.79 14.56L20.75 11.17C21.08 10.79 21.08 10.23 20.75 9.86V9.84Z"
        fill="currentColor"
      />
    </svg>
  );
}