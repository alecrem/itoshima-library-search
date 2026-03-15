import { data } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { fetchSearchResults } from "~/lib/library.server";
import { parseSearchResults } from "~/lib/parser.server";
import type { Book } from "~/lib/parser.server";
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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));

  if (!query) {
    return data({ query, page: 1, total: null, totalPages: 1, books: [] });
  }

  const html = await fetchSearchResults(query, page);
  const results = parseSearchResults(html);

  return data({
    query,
    ...results,
    total: results.total as number | null,
  });
}

type HomeData = {
  query: string;
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
  const query = url.searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));

  if (!query) {
    pendingResults = null;
    return { query, page: 1, total: null, totalPages: 1, books: [] };
  }

  const cached = getCachedSearchPage(query, page);
  if (cached) {
    pendingResults = null;
    return { ...cached, loading: false };
  }

  pendingResults = serverLoader() as Promise<HomeData>;
  return {
    query,
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
        if (fullData.query && fullData.books.length > 0) {
          cacheSearchPage(fullData);
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
  const { query, page, total, totalPages, books, loading } = useFullResults(
    loaderData as HomeData
  );

  useEffect(() => {
    if (!loading && query && books.length > 0) {
      cacheSearchPage({ query, page, total, totalPages, books });
    }
  }, [loading, query, page, total, totalPages, books]);

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
      <SearchBar query={query} total={total} page={page} loading={loading} />
      {!loading && (
        <>
          <ResultsGrid books={books} />
          {books.length > 0 && (
            <Pagination query={query} page={page} totalPages={totalPages} />
          )}
        </>
      )}
      <Footer />
    </main>
  );
}
