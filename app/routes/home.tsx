import { data } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { fetchSearchResults } from "~/lib/library.server";
import { parseSearchResults, type Book } from "~/lib/parser.server";
import { type SearchFilters } from "~/lib/constants";
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
    return data({ filters, page: 1, total: null, totalPages: 1, books: [] });
  }

  const html = await fetchSearchResults(filters, page);
  const results = parseSearchResults(html);

  return data({
    filters,
    ...results,
    total: results.total as number | null,
  });
}

type HomeData = {
  filters: SearchFilters;
  page: number;
  total: number | null;
  totalPages: number;
  books: Book[];
  loading?: boolean;
};

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
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loaderData]);

  return results;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { filters, page, total, totalPages, books, loading } = useFullResults(
    loaderData as HomeData
  );

  useEffect(() => {
    if (!loading && books.length > 0) {
      const key = cacheKey(filters, page);
      cacheSearchPage(key, { filters, page, total, totalPages, books });
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
