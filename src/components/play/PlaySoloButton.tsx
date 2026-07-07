"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/lib/routing";
import { useAuthModal } from "@/components/auth/AuthModalContext";

export function PlaySoloButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { openModal } = useAuthModal();

  const handleClick = () => {
    if (status === "authenticated" && session?.user) {
      router.push("/play");
      return;
    }

    openModal();
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}