import { data, useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/home";
import { fetchSearchResults } from "~/lib/library.server";
import { parseSearchResults, type Book } from "~/lib/parser.server";
import { PAGE_SIZE, type SearchFilters, filtersToSearchParams } from "~/lib/constants";
import { getCachedSearchPage, cacheSearchPage } from "~/lib/book-cache";
import { SearchBar } from "~/components/SearchBar";
import { ResultsGrid } from "~/components/ResultsGrid";
import { Pagination } from "~/components/Pagination";
import { Footer } from "~/components/Footer";
import { ThemeToggle } from "~/components/ThemeToggle";

export function meta() {
  return [
    { title: "糸島図書館 非公式検索" },
    { name: "description", content: "糸島市立図書館の蔵書を検索できる非公式ツール" },
    { property: "og:title", content: "糸島図書館 非公式検索" },
    { property: "og:description", content: "糸島市立図書館の蔵書を検索できる非公式ツール" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "糸島図書館 非公式検索" },
  ];
}

function parseList(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function filtersFromUrl(url: URL): SearchFilters {
  return {
    keyword: url.searchParams.get("q") ?? "",
    author: url.searchParams.get("author") ?? "",
    yearFrom: url.searchParams.get("yearFrom") ?? "",
    yearTo: url.searchParams.get("yearTo") ?? "",
    branches: parseList(url.searchParams.get("branch")),
    materialTypes: parseList(url.searchParams.get("type")),
  };
}

function cacheKey(filters: SearchFilters, page: number): string {
  return `${filters.keyword}|${filters.author}|${filters.yearFrom}|${filters.yearTo}|${filters.branches.join(",")}|${filters.materialTypes.join(",")}:${page}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filters = filtersFromUrl(url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));

  if (!filters.keyword && !filters.author) {
    return data({ filters, page: 1, total: null, totalPages: 1, books: [], adjacentPages: [] });
  }

  // Fetch in aligned 3-page blocks to pre-cache adjacent pages.
  // Block 1 = pages 1-3, block 2 = pages 4-6, etc.
  const BLOCK_SIZE = 3;
  const fetchCount = PAGE_SIZE * BLOCK_SIZE;
  const apiPage = Math.ceil(page / BLOCK_SIZE);
  const blockFirstPage = (apiPage - 1) * BLOCK_SIZE + 1;

  const html = await fetchSearchResults(filters, apiPage, fetchCount);
  const results = parseSearchResults(html);

  const total = results.total;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  // Slice fetched books into individual pages
  const indexInBlock = page - blockFirstPage;
  const currentBooks = results.books.slice(
    indexInBlock * PAGE_SIZE,
    (indexInBlock + 1) * PAGE_SIZE
  );

  const adjacentPages: { page: number; books: Book[] }[] = [];
  for (let i = 0; i < BLOCK_SIZE; i++) {
    const p = blockFirstPage + i;
    if (p === page || p > totalPages) continue;
    const pageBooks = results.books.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
    if (pageBooks.length > 0) {
      adjacentPages.push({ page: p, books: pageBooks });
    }
  }

  return data({
    filters,
    page,
    total: total as number | null,
    totalPages,
    books: currentBooks,
    adjacentPages,
  });
}

type AdjacentPage = { page: number; books: Book[] };

type HomeData = {
  filters: SearchFilters;
  page: number;
  total: number | null;
  totalPages: number;
  books: Book[];
  adjacentPages?: AdjacentPage[];
  loading?: boolean;
};

function cacheAdjacentPages(d: HomeData) {
  for (const adj of d.adjacentPages ?? []) {
    const adjKey = cacheKey(d.filters, adj.page);
    if (!getCachedSearchPage(adjKey)) {
      cacheSearchPage(adjKey, {
        page: adj.page,
        total: d.total,
        totalPages: d.totalPages,
        books: adj.books,
      });
    }
  }
}

let pendingResults: Promise<HomeData> | null = null;

export async function clientLoader({
  serverLoader,
  request,
}: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const filters = filtersFromUrl(url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));

  if (!filters.keyword && !filters.author) {
    pendingResults = null;
    return { filters, page: 1, total: null, totalPages: 1, books: [] };
  }

  const key = cacheKey(filters, page);
  const cached = getCachedSearchPage(key);
  if (cached) {
    pendingResults = null;
    return { ...cached, filters, loading: false };
  }

  // Prefetch requests (from useFetcher) await the full response and cache it
  if (url.searchParams.has("_prefetch")) {
    const result = (await serverLoader()) as HomeData;
    if (result.books.length > 0) {
      cacheSearchPage(key, result);
    }
    cacheAdjacentPages(result);
    return { ...result, loading: false };
  }

  pendingResults = serverLoader() as Promise<HomeData>;
  return {
    filters,
    page,
    total: null,
    totalPages: 1,
    books: [],
    loading: true,
  };
}

function useFullResults(loaderData: HomeData) {
  const [results, setResults] = useState(loaderData);

  useEffect(() => {
    setResults(loaderData);
  }, [loaderData]);

  useEffect(() => {
    if (!pendingResults) return;
    let cancelled = false;
    pendingResults.then((fullData) => {
      if (!cancelled) {
        setResults(fullData);
        pendingResults = null;
        if (fullData.books.length > 0) {
          const key = cacheKey(fullData.filters, fullData.page);
          cacheSearchPage(key, fullData);
        }
        cacheAdjacentPages(fullData);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loaderData]);

  return results;
}

function usePrefetchAdjacentPages(filters: SearchFilters, page: number, totalPages: number, loading?: boolean) {
  const prevFetcher = useFetcher<HomeData>();
  const nextFetcher = useFetcher<HomeData>();
  const prefetchedRef = useRef("");

  useEffect(() => {
    if (loading) return;
    const currentKey = cacheKey(filters, page);
    if (prefetchedRef.current === currentKey) return;
    prefetchedRef.current = currentKey;

    const base = filtersToSearchParams(filters);

    if (page > 1 && !getCachedSearchPage(cacheKey(filters, page - 1))) {
      prevFetcher.load(`/?${base}&page=${page - 1}&_prefetch`);
    }
    if (page < totalPages && !getCachedSearchPage(cacheKey(filters, page + 1))) {
      nextFetcher.load(`/?${base}&page=${page + 1}&_prefetch`);
    }
  }, [filters, page, totalPages, loading]);

  useEffect(() => {
    if (prevFetcher.data && prevFetcher.data.books.length > 0) {
      const d = prevFetcher.data;
      cacheSearchPage(cacheKey(d.filters, d.page), d);
      cacheAdjacentPages(d);
    }
  }, [prevFetcher.data]);

  useEffect(() => {
    if (nextFetcher.data && nextFetcher.data.books.length > 0) {
      const d = nextFetcher.data;
      cacheSearchPage(cacheKey(d.filters, d.page), d);
      cacheAdjacentPages(d);
    }
  }, [nextFetcher.data]);
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const results = useFullResults(loaderData as HomeData);
  const { filters, page, total, totalPages, books, loading } = results;

  usePrefetchAdjacentPages(filters, page, totalPages, loading);

  useEffect(() => {
    if (!loading && books.length > 0) {
      const key = cacheKey(filters, page);
      cacheSearchPage(key, { filters, page, total, totalPages, books });
      cacheAdjacentPages(results);
    }
  }, [loading, filters, page, total, totalPages, books]);

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>
          <a href="/">
            <img src="/icon-192.png" alt="" className="header-icon" />
            糸島図書館 非公式検索
          </a>
        </h1>
        <ThemeToggle />
      </header>
      <SearchBar filters={filters} total={total} page={page} loading={loading} />
      {!loading && (
        <>
          <ResultsGrid books={books} />
          {books.length > 0 && (
            <Pagination filters={filters} page={page} totalPages={totalPages} />
          )}
        </>
      )}
      <Footer />
    </main>
  );
}
