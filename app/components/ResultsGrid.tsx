import type { Book } from "~/lib/parser.server";
import { BookCard } from "./BookCard";

export function ResultsGrid({ books }: { books: Book[] }) {

  if (books.length === 0) return null;

  return (
    <div className="results-grid">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
