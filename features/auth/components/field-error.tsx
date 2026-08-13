export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-[12px] leading-snug text-ink">{message}</p>;
}
