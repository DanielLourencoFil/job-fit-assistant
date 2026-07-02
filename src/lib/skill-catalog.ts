/**
 * Canonical skill vocabulary — shared by the profile editor (multi-select)
 * and the extraction prompt (normalization target). Custom skills are allowed
 * on top; they travel to the prompt as hints (docs/DECISIONS.md #6).
 */
export const SKILL_CATALOG: readonly string[] = [
  // Languages
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "PHP",
  "C#",
  "Go",
  // Frontend
  "React",
  "Next.js",
  "Vue",
  "Nuxt",
  "Angular",
  "Svelte",
  "HTML",
  "CSS",
  "Tailwind",
  "Redux",
  "Responsive Design",
  // Backend & APIs
  "Node.js",
  "NestJS",
  "Express",
  "REST APIs",
  "GraphQL",
  "Laravel",
  "Spring",
  // Data
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "SQL",
  "Prisma",
  "Redis",
  // Quality & tooling
  "Git",
  "CI/CD",
  "Docker",
  "Kubernetes",
  "Vitest",
  "Jest",
  "Playwright",
  "Cypress",
  "Clean Code",
  "Testing",
  // Ways of working
  "Scrum",
  "Agile",
  // AI
  "Claude Code",
  "AI-assisted development",
  "LLM integration",
  "Prompt engineering",
] as const;
