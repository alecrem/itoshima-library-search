import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseSearchResults } from "../app/lib/parser.server";

const fixture = readFileSync(
  join(__dirname, "fixtures/search_results.html"),
  "utf-8"
);

describe("parseSearchResults", () => {
  const results = parseSearchResults(fixture);

  it("extracts total count", () => {
    expect(results.total).toBe(471);
  });

  it("extracts page info", () => {
    expect(results.page).toBe(1);
    expect(results.totalPages).toBe(48);
  });

  it("extracts 10 books", () => {
    expect(results.books).toHaveLength(10);
  });

  it("extracts book ID", () => {
    expect(results.books[0].id).toBe("162873");
  });

  it("extracts title", () => {
    expect(results.books[0].title).toBe(
      "愛と小さないのちのトライアングル"
    );
  });

  it("extracts subtitle", () => {
    expect(results.books[0].subtitle).toBe(
      "宮沢賢治・中村哲・高木仁三郎"
    );
  });

  it("extracts author and authorId", () => {
    expect(results.books[0].author).toBe("斎藤　文一／著");
    expect(results.books[0].authorId).toBe("70259");
  });

  it("extracts publisher", () => {
    expect(results.books[0].publisher).toBe("東京：国文社");
  });

  it("extracts publication year", () => {
    expect(results.books[0].year).toBe("2007.07");
  });

  it("extracts material type", () => {
    expect(results.books[0].type).toBe("一般図書");
  });

  it("extracts ISBN from image id", () => {
    expect(results.books[0].isbn).toBe("9784772009478");
  });

  it("marks available books as available", () => {
    expect(results.books[0].available).toBe(true);
  });

  it("marks lent books as unavailable", () => {
    const lentBook = results.books.find((b) => !b.available);
    expect(lentBook).toBeDefined();
    expect(lentBook?.title).toBe("あたまの底のさびしい歌");
  });

  it("returns empty results for html with no books", () => {
    const empty = parseSearchResults("<html><body>No results</body></html>");
    expect(empty.total).toBe(0);
    expect(empty.books).toHaveLength(0);
  });
});
