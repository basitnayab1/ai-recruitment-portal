/**
 * Shared password rules for HR change-password (client strength UI + server validation).
 */

export type PasswordRequirement = {
  id: "length" | "lowercase" | "uppercase" | "number" | "special";
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

export type PasswordStrength = {
  score: number;
  max: number;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  met: Record<PasswordRequirement["id"], boolean>;
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const met = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  } as Record<PasswordRequirement["id"], boolean>;

  let score = 0;
  for (const requirement of PASSWORD_REQUIREMENTS) {
    const ok = requirement.test(password);
    met[requirement.id] = ok;
    if (ok) score += 1;
  }

  const max = PASSWORD_REQUIREMENTS.length;
  let label: PasswordStrength["label"] = "Too weak";
  if (score <= 1) label = "Too weak";
  else if (score === 2) label = "Weak";
  else if (score === 3) label = "Fair";
  else if (score === 4) label = "Good";
  else label = "Strong";

  return { score, max, label, met };
}

export function validateNewPassword(password: string): string | null {
  const unmet = PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.test(password));
  if (unmet.length === 0) return null;
  return `Password must include: ${unmet.map((item) => item.label.toLowerCase()).join(", ")}.`;
}
