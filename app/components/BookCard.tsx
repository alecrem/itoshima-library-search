import { Link } from "react-router";
import type { Book } from "~/lib/parser.server";
import { useBookCover } from "~/hooks/useBookCover";
import { BookPlaceholder } from "./BookPlaceholder";
import { LibraryLink } from "./LibraryLink";

export function BookCard({ book }: { book: Book }) {
  const coverUrl = useBookCover(book.isbn);

  return (
    <article className="book-card">
      <Link to={`/book/${book.id}`} prefetch="intent" className="book-cover">
        {coverUrl ? <img src={coverUrl} alt="" loading="lazy" /> : <BookPlaceholder />}
      </Link>
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
