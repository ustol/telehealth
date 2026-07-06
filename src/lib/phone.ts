export function cleanPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/[ +-]/g, "");
}

export function phoneNeedsCheck(value: string | null | undefined): boolean {
  const cleaned = cleanPhone(value);
  return cleaned.length > 0 && cleaned.length < 10;
}
