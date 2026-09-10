/**
 * Formatters are pinned to en-US/UTC so the server and the client render the
 * exact same string — anything locale- or "now"-dependent would hydrate wrong.
 */
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}

export function formatDateTime(iso: string, separator = " · "): string {
  return `${formatDate(iso)}${separator}${formatTime(iso)}`;
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
