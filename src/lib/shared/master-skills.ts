/**
 * Searchable master skills library for candidate profile + HR job chips.
 * Safe for Server and Client Components (plain data, no "use client").
 */

export type SkillCategory =
  | "Software Development"
  | "Mobile"
  | "Design"
  | "Marketing"
  | "Office"
  | "Support"
  | "Business"
  | "AI"
  | "Cloud & DevOps"
  | "Data";

export type MasterSkill = {
  name: string;
  category: SkillCategory;
};

export const MASTER_SKILLS: readonly MasterSkill[] = [
  // Software Development
  { name: "React", category: "Software Development" },
  { name: "Next.js", category: "Software Development" },
  { name: "Angular", category: "Software Development" },
  { name: "Vue", category: "Software Development" },
  { name: "Vue.js", category: "Software Development" },
  { name: "Node.js", category: "Software Development" },
  { name: "Express", category: "Software Development" },
  { name: "NestJS", category: "Software Development" },
  { name: "PHP", category: "Software Development" },
  { name: "Laravel", category: "Software Development" },
  { name: "Python", category: "Software Development" },
  { name: "Django", category: "Software Development" },
  { name: "Flask", category: "Software Development" },
  { name: "FastAPI", category: "Software Development" },
  { name: "Java", category: "Software Development" },
  { name: "Spring", category: "Software Development" },
  { name: "Spring Boot", category: "Software Development" },
  { name: "C#", category: "Software Development" },
  { name: ".NET", category: "Software Development" },
  { name: "Go", category: "Software Development" },
  { name: "Rust", category: "Software Development" },
  { name: "TypeScript", category: "Software Development" },
  { name: "JavaScript", category: "Software Development" },
  { name: "HTML", category: "Software Development" },
  { name: "CSS", category: "Software Development" },
  { name: "Tailwind CSS", category: "Software Development" },
  { name: "GraphQL", category: "Software Development" },
  { name: "REST API", category: "Software Development" },
  { name: "Git", category: "Software Development" },
  { name: "GitHub", category: "Software Development" },
  { name: "GitLab", category: "Software Development" },
  { name: "CI/CD", category: "Software Development" },
  { name: "Jest", category: "Software Development" },
  { name: "Cypress", category: "Software Development" },
  { name: "Playwright", category: "Software Development" },

  // Data
  { name: "SQL", category: "Data" },
  { name: "PostgreSQL", category: "Data" },
  { name: "MySQL", category: "Data" },
  { name: "MongoDB", category: "Data" },
  { name: "Redis", category: "Data" },
  { name: "Elasticsearch", category: "Data" },
  { name: "Snowflake", category: "Data" },
  { name: "BigQuery", category: "Data" },
  { name: "Pandas", category: "Data" },
  { name: "Power BI", category: "Data" },
  { name: "Tableau", category: "Data" },

  // Cloud & DevOps
  { name: "Docker", category: "Cloud & DevOps" },
  { name: "Kubernetes", category: "Cloud & DevOps" },
  { name: "AWS", category: "Cloud & DevOps" },
  { name: "Azure", category: "Cloud & DevOps" },
  { name: "GCP", category: "Cloud & DevOps" },
  { name: "Terraform", category: "Cloud & DevOps" },
  { name: "Linux", category: "Cloud & DevOps" },
  { name: "Nginx", category: "Cloud & DevOps" },

  // Mobile
  { name: "Flutter", category: "Mobile" },
  { name: "React Native", category: "Mobile" },
  { name: "Swift", category: "Mobile" },
  { name: "Kotlin", category: "Mobile" },
  { name: "Android", category: "Mobile" },
  { name: "iOS", category: "Mobile" },

  // Design
  { name: "Photoshop", category: "Design" },
  { name: "Adobe Photoshop", category: "Design" },
  { name: "Illustrator", category: "Design" },
  { name: "Adobe Illustrator", category: "Design" },
  { name: "Figma", category: "Design" },
  { name: "Adobe XD", category: "Design" },
  { name: "Canva", category: "Design" },
  { name: "After Effects", category: "Design" },
  { name: "Premiere Pro", category: "Design" },
  { name: "DaVinci Resolve", category: "Design" },
  { name: "Blender", category: "Design" },
  { name: "UI Design", category: "Design" },
  { name: "UX Design", category: "Design" },

  // Marketing
  { name: "SEO", category: "Marketing" },
  { name: "SEM", category: "Marketing" },
  { name: "Google Ads", category: "Marketing" },
  { name: "Facebook Ads", category: "Marketing" },
  { name: "Content Writing", category: "Marketing" },
  { name: "Copywriting", category: "Marketing" },
  { name: "Email Marketing", category: "Marketing" },
  { name: "Social Media Marketing", category: "Marketing" },
  { name: "Google Analytics", category: "Marketing" },

  // Office
  { name: "Excel", category: "Office" },
  { name: "Microsoft Excel", category: "Office" },
  { name: "Word", category: "Office" },
  { name: "Microsoft Word", category: "Office" },
  { name: "PowerPoint", category: "Office" },
  { name: "Google Sheets", category: "Office" },
  { name: "Google Docs", category: "Office" },

  // Support
  { name: "Customer Support", category: "Support" },
  { name: "Virtual Assistant", category: "Support" },
  { name: "Data Entry", category: "Support" },
  { name: "Zendesk", category: "Support" },
  { name: "Freshdesk", category: "Support" },

  // Business
  { name: "Project Management", category: "Business" },
  { name: "Scrum", category: "Business" },
  { name: "Agile", category: "Business" },
  { name: "Leadership", category: "Business" },
  { name: "Communication", category: "Business" },
  { name: "Problem Solving", category: "Business" },
  { name: "Jira", category: "Business" },
  { name: "Confluence", category: "Business" },
  { name: "Stakeholder Management", category: "Business" },

  // AI
  { name: "ChatGPT", category: "AI" },
  { name: "Claude", category: "AI" },
  { name: "Cursor", category: "AI" },
  { name: "OpenAI API", category: "AI" },
  { name: "LangChain", category: "AI" },
  { name: "RAG", category: "AI" },
  { name: "Vector Database", category: "AI" },
  { name: "Prompt Engineering", category: "AI" },
  { name: "Machine Learning", category: "AI" },
  { name: "PyTorch", category: "AI" },
  { name: "TensorFlow", category: "AI" },
] as const;

/** Flat list of skill names (deduped, stable order). */
export const MASTER_SKILL_NAMES: readonly string[] = [
  ...new Set(MASTER_SKILLS.map((skill) => skill.name)),
];

/** Search master skills by name or category. */
export function searchMasterSkills(query: string, limit = 12): MasterSkill[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return MASTER_SKILLS.slice(0, limit);
  }

  const scored: Array<{ skill: MasterSkill; score: number }> = [];
  for (const skill of MASTER_SKILLS) {
    const name = skill.name.toLowerCase();
    const category = skill.category.toLowerCase();
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (category.includes(q)) score = 30;
    if (score > 0) scored.push({ skill, score });
  }

  scored.sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));
  return scored.slice(0, limit).map((entry) => entry.skill);
}
