"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

interface FilterPanelProps {
  mediums: string[];
  tagsByCategory: Record<string, { id: number; name: string }[]>;
}

export function FilterPanel({ mediums, tagsByCategory }: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentMedium = searchParams.get("medium") ?? "";
  const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleTag(tagId: string) {
    const next = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    updateParams("tags", next.join(","));
  }

  function toggleMedium(medium: string) {
    updateParams("medium", currentMedium === medium ? "" : medium);
  }

  const filterContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Medium filter */}
      <div>
        <h4
          style={{
            fontFamily: "var(--font-nav)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-slate-dark)",
            marginBottom: "0.5rem",
          }}
        >
          Medium
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {mediums.map((m) => (
            <label
              key={m}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--color-slate)",
                padding: "0.25rem 0",
              }}
            >
              <input
                type="checkbox"
                checked={currentMedium === m}
                onChange={() => toggleMedium(m)}
                style={{ accentColor: "var(--color-teal)" }}
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      {/* Tag category filters */}
      {Object.entries(tagsByCategory).map(([category, catTags]) => (
        <details key={category}>
          <summary
            style={{
              fontFamily: "var(--font-nav)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--color-slate-dark)",
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <span style={{ fontSize: "0.625rem", transition: "transform 150ms" }}>
              &#9654;
            </span>
            {category}
          </summary>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              marginTop: "0.375rem",
              paddingLeft: "0.25rem",
            }}
          >
            {catTags.map((tag) => (
              <label
                key={tag.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-slate)",
                  padding: "0.2rem 0",
                }}
              >
                <input
                  type="checkbox"
                  checked={currentTags.includes(String(tag.id))}
                  onChange={() => toggleTag(String(tag.id))}
                  style={{ accentColor: "var(--color-teal)" }}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </details>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        style={{
          display: "none",
          fontFamily: "var(--font-nav)",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "var(--color-teal)",
          backgroundColor: "var(--color-teal-light)",
          border: "1px solid var(--color-teal)",
          borderRadius: "var(--radius-full)",
          padding: "0.5rem 1.25rem",
          cursor: "pointer",
          minHeight: "44px",
        }}
        className="filter-toggle-mobile"
      >
        {drawerOpen ? "Hide Filters" : "Filters"}
      </button>

      {/* Desktop sidebar */}
      <aside
        className="filter-sidebar"
        style={{
          minWidth: "220px",
          maxWidth: "250px",
        }}
      >
        {filterContent}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="filter-drawer-mobile"
          style={{
            display: "none",
            padding: "1rem 0",
          }}
        >
          {filterContent}
        </div>
      )}
    </>
  );
}
