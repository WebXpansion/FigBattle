import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Prévient l'auteur que sa maquette a été supprimée par la modération.
export async function sendRemovalEmail(
  to: string,
  name: string,
  themeLabel: string,
  locale: string
) {
  const safeName = escapeHtml(name);
  const safeThemeLabel = escapeHtml(themeLabel);

  const subject =
    locale === "fr"
      ? "Ta maquette a été supprimée"
      : "Your mockup has been removed";

  const intro =
    locale === "fr"
      ? `Salut ${safeName}, ta maquette sur le thème « ${safeThemeLabel} » a enfreint les règles et a été supprimée.`
      : `Hi ${safeName}, your mockup for the theme "${safeThemeLabel}" broke the rules and has been removed.`;

  if (!resend) {
    console.log(`[DEV] Email de suppression pour ${to} : ${intro}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>FigBattle</h2>
        <p>${intro}</p>
      </div>
    `,
  });
}