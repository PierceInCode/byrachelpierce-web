"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useCallback, useEffect, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => updateSearch(val), 350);
  }

  return (
    <div style={{ position: "relative", maxWidth: "400px", width: "100%" }}>
      <input
        type="search"
        placeholder="Search paintings..."
        value={value}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "0.625rem 1rem 0.625rem 2.5rem",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--color-slate-dark)",
          backgroundColor: "var(--color-offwhite)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-full)",
          outline: "none",
          minHeight: "44px",
        }}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          width: "1.125rem",
          height: "1.125rem",
          color: "var(--color-slate-light)",
          pointerEvents: "none",
        }}
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
