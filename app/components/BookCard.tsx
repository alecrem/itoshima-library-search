import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Book } from "~/lib/parser.server";
import { LibraryLink } from "./LibraryLink";

function useBookCover(isbn: string) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isbn) return;

    let cancelled = false;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=items/volumeInfo/imageLinks`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const thumbnail =
          data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail ?? null;
        if (thumbnail) {
          setCoverUrl(thumbnail.replace("http://", "https://"));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isbn]);

  return coverUrl;
}

export function BookCard({ book }: { book: Book }) {
  const coverUrl = useBookCover(book.isbn);

  return (
    <article className="book-card">
      <div className="book-cover">
        {coverUrl && <img src={coverUrl} alt="" loading="lazy" />}
      </div>
      <div className="book-info">
        <h3 className="book-title">
          <Link to={`/book/${book.id}`} prefetch="intent">
            {book.title}
          </Link>
          {book.subtitle && (
            <span className="book-subtitle"> — {book.subtitle}</span>
          )}
        </h3>
        {book.author && <p className="book-author">{book.author}</p>}
        <div className="book-meta">
          {book.publisher && <span>{book.publisher}</span>}
          {book.year && <span>{book.year}</span>}
          {book.type && <span>{book.type}</span>}
        </div>
        <div className="book-bottom">
          <span
            className={`book-availability ${book.available ? "available" : "lent"}`}
          >
            {book.available ? "利用可能" : "貸出中"}
          </span>
          <LibraryLink bookId={book.id} />
        </div>
      </div>
    </article>
  );
}
