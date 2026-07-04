"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // Show max 7 page buttons
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    fontFamily: "var(--font-nav)",
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    minWidth: "44px",
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 180ms cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.375rem",
        marginTop: "2.5rem",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          ...btnBase,
          backgroundColor: "var(--color-white)",
          color: currentPage === 1 ? "var(--color-border)" : "var(--color-slate)",
          opacity: currentPage === 1 ? 0.5 : 1,
          padding: "0 0.75rem",
        }}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            style={{
              ...btnBase,
              border: "none",
              cursor: "default",
              color: "var(--color-slate-light)",
            }}
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            style={{
              ...btnBase,
              backgroundColor:
                p === currentPage ? "var(--color-teal)" : "var(--color-white)",
              color:
                p === currentPage ? "var(--color-white)" : "var(--color-slate)",
              borderColor:
                p === currentPage ? "var(--color-teal)" : "var(--color-border)",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          ...btnBase,
          backgroundColor: "var(--color-white)",
          color:
            currentPage === totalPages
              ? "var(--color-border)"
              : "var(--color-slate)",
          opacity: currentPage === totalPages ? 0.5 : 1,
          padding: "0 0.75rem",
        }}
      >
        Next
      </button>
    </nav>
  );
}
