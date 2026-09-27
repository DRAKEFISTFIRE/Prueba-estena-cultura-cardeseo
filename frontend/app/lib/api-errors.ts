export type ZodIssue = {
  code?: string;
  path?: (string | number)[];
  message?: string;
};

function formatZodIssue(issue: ZodIssue): string {
  const field =
    Array.isArray(issue?.path) && issue.path.length > 0
      ? issue.path.join(".")
      : null;

  const code = issue?.code ? ` (${issue.code})` : "";
  const message = issue?.message ?? "Valor no vàlid";

  return field ? `${field}: ${message}${code}` : `${message}${code}`;
}

function extractIssues(data: unknown): ZodIssue[] | null {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.issues)) {
      return obj.issues as ZodIssue[];
    }

    if (Array.isArray(obj.errors)) {
      return obj.errors as ZodIssue[];
    }
  }

  return null;
}

export function formatApiError(data: unknown, fallback: string): string {
  const issues = extractIssues(data);

  if (issues && issues.length > 0) {
    return issues.map(formatZodIssue).join(" — ");
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.error === "string") {
      return obj.error;
    }

    if (typeof obj.message === "string") {
      return obj.message;
    }
  }

  return fallback;
}

export function errorTargetsField(data: unknown, field: string): boolean {
  const issues = extractIssues(data);

  if (!issues) {
    return false;
  }

  return issues.some(
    issue => Array.isArray(issue?.path) && issue.path.includes(field)
  );
}