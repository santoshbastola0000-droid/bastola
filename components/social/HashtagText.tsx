import Link from "next/link";

const HASHTAG_RE = /(#[A-Za-z0-9_\u0900-\u097F]{2,50})/g;
const VALID_TAG_RE = /^#[A-Za-z0-9_\u0900-\u097F]{2,50}$/;

export function HashtagText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = String(text || "").split(HASHTAG_RE);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!VALID_TAG_RE.test(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        const tag = part.slice(1).normalize("NFKC").toLowerCase();
        return (
          <Link
            key={`${part}-${index}`}
            href={`/hashtag/${encodeURIComponent(tag)}`}
            className="font-semibold text-[var(--primary,#2563eb)] hover:underline"
          >
            {part}
          </Link>
        );
      })}
    </span>
  );
}
