import type { Book, BookDetail } from "./parser.server";

const cache = new Map<string, Book>();
const detailCache = new Map<string, BookDetail>();
const coverCache = new Map<string, string>();

export function cacheBooks(books: Book[]) {
  for (const book of books) {
    cache.set(book.id, book);
  }
}

export function getCachedBook(id: string): Book | undefined {
  return cache.get(id);
}

export function cacheCoverUrl(isbn: string, url: string) {
  coverCache.set(isbn, url);
}

export function getCachedCoverUrl(isbn: string): string | null {
  return coverCache.get(isbn) ?? null;
}

type SearchPage = {
  query: string;
  page: number;
  total: number | null;
  totalPages: number;
  books: Book[];
};

const searchCache = new Map<string, SearchPage>();

function searchKey(query: string, page: number): string {
  return `${query}:${page}`;
}

export function cacheSearchPage(data: SearchPage) {
  searchCache.set(searchKey(data.query, data.page), data);
  cacheBooks(data.books);
}

export function getCachedSearchPage(query: string, page: number): SearchPage | undefined {
  return searchCache.get(searchKey(query, page));
}

export function cacheBookDetail(id: string, detail: BookDetail) {
  detailCache.set(id, detail);
}

export function getCachedBookDetail(id: string): BookDetail | undefined {
  return detailCache.get(id);
}
