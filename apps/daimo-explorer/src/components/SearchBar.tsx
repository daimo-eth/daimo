"use client";

import { getAccountName } from "@daimo/common";
import { SearchIcon } from "@primer/octicons-react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import classNames from "classnames";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

import { SearchResult } from "../lib/search";

const queryClient = new QueryClient();

export function SearchBar() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchAndResults />
    </QueryClientProvider>
  );
}

function SearchAndResults() {
  const [q, setQ] = useState("");
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value.trim());
  }, []);

  const result = useQuery({
    enabled: q.length > 0,
    queryKey: [q],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((v) => v as SearchResult[]),
  });

  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    []
  );

  return (
    <div className="relative">
      <input
        type="text"
        className="bg-blue-100 rounded-md pl-9 pr-4 py-2 w-full"
        placeholder="0x..."
        onFocus={onFocus}
        onChange={onChange}
      />
      <SearchIcon className="absolute top-3 left-3" size="small" fill="#999" />
      {result.data && <div className="h-2" />}
      {result.data && !result.data.length && (
        <div className="px-2 text-gray-800">No results</div>
      )}
      {result.data && <ResultList results={result.data} />}
      {result.error != null && (
        <div className="text-red-700">{String(result.error)}</div>
      )}
    </div>
  );
}

function ResultList({ results }: { results: SearchResult[] }) {
  const [selIx, setSelIx] = useState(0);

  // Listen for keyboard events, update selection on up and down arrow
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        setSelIx((ix) => Math.max(0, ix - 1));
      } else if (e.key === "ArrowDown") {
        setSelIx((ix) => Math.min(results.length - 1, ix + 1));
      } else if (e.key === "Enter") {
        window.location.href = getUrl(results[selIx]);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  return (
    <ul>
      {results.map((r, i) => (
        <Result key={i} result={r} sel={i === selIx} />
      ))}
    </ul>
  );
}

function Result({ result, sel }: { result: SearchResult; sel: boolean }) {
  return (
    <a
      href={getUrl(result)}
      className={classNames(`block rounded-md px-4 py-2`, {
        "bg-gray-100": sel,
      })}
    >
      <div className="text-gray-800 text-base">{result.type}</div>
      <div className="text-gray-600 text-sm overflow-hidden text-ellipsis">
        {result.type === "userop" && result.hash}
        {result.type === "address" && getAccountName(result)}
      </div>
    </a>
  );
}

function getUrl(result: SearchResult) {
  const { type } = result;
  switch (type) {
    case "userop":
      return `/op/${result.hash}`;
    case "address":
      return `/addr/${result.addr}`;
    default:
      throw new Error(`Bad result type: ${type}`);
  }
}
