"use client";

// Deux bandes blanches qui glissent depuis l'extérieur (effet focus cinéma).
export function CinemaBars({ active }: { active: boolean }) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-30 h-[8vh] bg-black transition-transform duration-700 ease-in-out ${
          active ? "translate-y-0" : "-translate-y-full"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[8vh] bg-black transition-transform duration-700 ease-in-out ${
          active ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden="true"
      />
    </>
  );
}