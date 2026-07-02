import type { Profile } from "./types";

/** My profile — the fixed reference the fit engine compares postings against. */
export const profile: Profile = {
  skills: [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Vue",
    "Node.js",
    "NestJS",
    "PostgreSQL",
    "SQL",
    "Prisma",
    "Tailwind",
    "Vitest",
    "Playwright",
    "REST APIs",
    "Claude Code",
    "AI-assisted development",
  ],
  languages: {
    german: "B2",
    english: "fluent",
    portuguese: "native",
    spanish: "fluent",
  },
  seniority:
    "career-changer with a production SaaS (junior/mid; senior-only is a stretch)",
  location: "Nürnberg, Germany",
  region: ["Nürnberg", "Fürth", "Erlangen"],
  remoteOk: true,
};
