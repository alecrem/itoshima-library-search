import { data } from "react-router";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/book.$id";
import { fetchBookDetail } from "~/lib/library.server";
import { parseBookDetail } from "~/lib/parser.server";
import type { BookDetail } from "~/lib/parser.server";
import { LibraryLink } from "~/components/LibraryLink";

export function meta({ data: loaderData }: Route.MetaArgs) {
  const detail = loaderData as BookDetail | undefined;
  const title = detail?.title ?? "書籍詳細";
  return [
    { title: `${title} | 糸島市立図書館` },
    { name: "description", content: detail?.description?.slice(0, 160) ?? "" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const bookId = params.id;
  if (!bookId) {
    throw new Response("Book ID required", { status: 400 });
  }

  const html = await fetchBookDetail(bookId);
  const detail = parseBookDetail(html);

  if (!detail.title) {
    throw new Response("Book not found", { status: 404 });
  }

  return data({ ...detail, bookId });
}

function useBookCover(isbn: string) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isbn) return;
    let cancelled = false;
    fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=items/volumeInfo/imageLinks`
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const thumb = d?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (thumb) setCoverUrl(thumb.replace("http://", "https://"));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isbn]);

  return coverUrl;
}

export default function BookDetailPage({ loaderData }: Route.ComponentProps) {
  const detail = loaderData;
  const coverUrl = useBookCover(detail.isbn);

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>
          <Link to="/">糸島市立図書館 検索</Link>
        </h1>
      </header>

      <article className="detail-page">
        <div className="detail-top">
          {coverUrl && (
            <div className="detail-cover">
              <img src={coverUrl} alt="" />
            </div>
          )}
          <div className="detail-header">
            <h2 className="detail-title">{detail.title}</h2>
            {detail.subtitle && (
              <p className="detail-subtitle">{detail.subtitle}</p>
            )}
            {detail.author && (
              <p className="detail-author">{detail.author}</p>
            )}
            <div className="detail-meta">
              {detail.publisher && <span>{detail.publisher}</span>}
              {detail.year && <span>{detail.year}</span>}
              {detail.isbn && <span>ISBN: {detail.isbn}</span>}
            </div>
            <div className="detail-availability">
              <span className="avail-badge available">
                貸出可能: {detail.availableCopies}
              </span>
              <span className="avail-badge lent">
                貸出中: {detail.lentCopies}
              </span>
              <span className="avail-badge">予約: {detail.reservations}</span>
            </div>
            <LibraryLink bookId={detail.bookId} className="detail-library-link" />
          </div>
        </div>

        {detail.description && (
          <section className="detail-section">
            <h3>内容紹介</h3>
            <p>{detail.description}</p>
          </section>
        )}

        {detail.otherInfo && (
          <section className="detail-section">
            <h3>その他</h3>
            <p className="detail-other-info">{detail.otherInfo}</p>
          </section>
        )}

        {detail.holdings.length > 0 && (
          <section className="detail-section">
            <h3>所蔵情報</h3>
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>館</th>
                  <th>種別</th>
                  <th>場所</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {detail.holdings.map((h, i) => (
                  <tr key={i}>
                    <td>{h.library}</td>
                    <td>{h.type}</td>
                    <td>{h.location}</td>
                    <td
                      className={
                        h.status.includes("貸出できます")
                          ? "status-available"
                          : "status-lent"
                      }
                    >
                      {h.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </article>
    </main>
  );
}
