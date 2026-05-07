export function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

export function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 16);
}

