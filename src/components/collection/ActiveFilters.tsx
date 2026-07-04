"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ActiveFiltersProps {
  mediums: string[];
  tagsByCategory: Record<string, { id: number; name: string }[]>;
}

export function ActiveFilters({ mediums, tagsByCategory }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentMedium = searchParams.get("medium") ?? "";
  const currentQuery = searchParams.get("q") ?? "";
  const currentTags =
    searchParams.get("tags")?.split(",").filter(Boolean) ?? [];

  const hasFilters = currentMedium || currentQuery || currentTags.length > 0;
  if (!hasFilters) return null;

  // Resolve tag IDs to names
  const allTags = Object.values(tagsByCategory).flat();
  const activeTagNames = currentTags.map((id) => {
    const tag = allTags.find((t) => String(t.id) === id);
    return tag ? tag.name : id;
  });

  function removeParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "tags" && value) {
      const remaining = currentTags.filter((t) => t !== value);
      if (remaining.length > 0) {
        params.set("tags", remaining.join(","));
      } else {
        params.delete("tags");
      }
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontFamily: "var(--font-nav)",
    fontSize: "12px",
    color: "var(--color-teal-dark)",
    backgroundColor: "var(--color-teal-light)",
    padding: "0.3rem 0.625rem",
    borderRadius: "var(--radius-full)",
    border: "1px solid rgba(54,181,205,0.25)",
    cursor: "pointer",
    transition: "all 150ms ease",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-nav)",
          fontSize: "var(--text-xs)",
          color: "var(--color-slate-light)",
          letterSpacing: "0.06em",
        }}
      >
        Active filters:
      </span>

      {currentQuery && (
        <button onClick={() => removeParam("q")} style={pillStyle}>
          &ldquo;{currentQuery}&rdquo; &times;
        </button>
      )}

      {currentMedium && (
        <button onClick={() => removeParam("medium")} style={pillStyle}>
          {currentMedium} &times;
        </button>
      )}

      {currentTags.map((tagId, i) => (
        <button
          key={tagId}
          onClick={() => removeParam("tags", tagId)}
          style={pillStyle}
        >
          {activeTagNames[i]} &times;
        </button>
      ))}

      <button
        onClick={clearAll}
        style={{
          ...pillStyle,
          backgroundColor: "transparent",
          border: "none",
          color: "var(--color-coral)",
          fontWeight: 600,
        }}
      >
        Clear all
      </button>
    </div>
  );
}
