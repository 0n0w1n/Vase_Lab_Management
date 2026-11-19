"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "cn";

type Props = {
  /** The search param this box owns, e.g. "q" for ?q=… */
  param?: string;
  placeholder?: string;
  /** How long to wait after the last keystroke before updating the URL */
  debounceMs?: number;
  className?: string;
};

/**
 * A text search box backed by one URL search param, the text-input sibling of
 * UrlFilter. It writes ?<param>=<text> (debounced) and leaves the other params
 * alone, so it combines with any number of filters. The page reads the same
 * param on the server to do the matching.
 */
export default function UrlSearch({
  param = "q",
  placeholder = "Search…",
  debounceMs = 300,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(param) ?? "";
  const [text, setText] = useState(urlValue);
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow the URL when it changes from outside (back button, a link, a reset).
  // Done during render rather than in an effect, as React recommends.
  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue);
    // Skip when it's just our own commit landing, so a trailing space mid-typing survives.
    if (urlValue !== text.trim()) setText(urlValue);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function commit(value: string) {
    const next = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) next.set(param, trimmed);
    else next.delete(param);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function change(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(value), debounceMs);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    setText("");
    commit("");
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="pointer-events-none absolute left-2.5 size-3.5 text-slate-500" />
      <input
        type="search"
        value={text}
        onChange={(event) => change(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (timer.current) clearTimeout(timer.current);
            commit(text);
          } else if (event.key === "Escape" && text) {
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md bg-white py-2 pr-7 pl-8 text-xs font-semibold text-slate-800 ring-1 ring-black/10 outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-sidebar [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
