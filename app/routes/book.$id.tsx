import { data } from "react-router";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/book.$id";
import { fetchBookDetail } from "~/lib/library.server";
import { parseBookDetail } from "~/lib/parser.server";
import type { BookDetail, Holding } from "~/lib/parser.server";
import { getCachedBook, getCachedBookDetail, cacheBookDetail } from "~/lib/book-cache";
import { useBookCover } from "~/hooks/useBookCover";
import { BookPlaceholder } from "~/components/BookPlaceholder";
import { LibraryLink } from "~/components/LibraryLink";
import { Footer } from "~/components/Footer";
import { ThemeToggle } from "~/components/ThemeToggle";

export function meta({ data: loaderData }: Route.MetaArgs) {
  const detail = loaderData as BookDetail | undefined;
  const title = detail?.title ?? "書籍詳細";
  return [
    { title: `${title} | 糸島図書館 非公式検索` },
    { name: "description", content: detail?.description?.slice(0, 160) ?? "" },
    { property: "og:title", content: title },
    { property: "og:description", content: detail?.description?.slice(0, 160) ?? "" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "糸島図書館 非公式検索" },
    { name: "robots", content: "noindex" },
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

  return data({ ...detail, bookId, partial: false });
}

let pendingDetail: Promise<DetailData> | null = null;

type DetailData = BookDetail & { bookId: string; partial: boolean };

export async function clientLoader({
  serverLoader,
  params,
}: Route.ClientLoaderArgs) {
  const id = params.id ?? "";

  const cachedDetail = getCachedBookDetail(id);
  if (cachedDetail) {
    pendingDetail = null;
    return { ...cachedDetail, bookId: id, partial: false };
  }

  const cached = getCachedBook(id);
  if (cached) {
    pendingDetail = serverLoader() as Promise<DetailData>;
    return {
      bookId: cached.id,
      title: cached.title,
      subtitle: cached.subtitle,
      author: cached.author,
      authorId: cached.authorId,
      publisher: cached.publisher,
      year: cached.year,
      isbn: cached.isbn,
      description: "",
      otherInfo: "",
      reservations: 0,
      availableCopies: 0,
      lentCopies: 0,
      holdings: [] as Holding[],
      partial: true,
    };
  }

  pendingDetail = null;
  return serverLoader();
}


function useFullDetail(loaderData: DetailData) {
  const [detail, setDetail] = useState(loaderData);

  useEffect(() => {
    setDetail(loaderData);
  }, [loaderData]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pendingDetail is module-level, not a reactive dependency
  useEffect(() => {
    if (!pendingDetail) return;
    let cancelled = false;
    pendingDetail.then((fullData) => {
      if (!cancelled) {
        setDetail(fullData);
        pendingDetail = null;
        cacheBookDetail(fullData.bookId, fullData);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loaderData]);

  return detail;
}

export default function BookDetailPage({ loaderData }: Route.ComponentProps) {
  const detail = useFullDetail(loaderData as unknown as DetailData);
  const coverUrl = useBookCover(detail.isbn);

  useEffect(() => {
    if (!detail.partial && detail.bookId) {
      cacheBookDetail(detail.bookId, detail);
    }
  }, [detail]);

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>
          <Link to="/"><img src="/icon-192.png" alt="" className="header-icon" />糸島図書館 非公式検索</Link>
        </h1>
        <ThemeToggle />
      </header>

      <article className="detail-page">
        <div className="detail-top">
          <div className="detail-cover">
            {coverUrl ? <img src={coverUrl} alt="" /> : <BookPlaceholder className="detail-placeholder" />}
          </div>
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
            <div aria-live="polite" aria-atomic="true">
              {!detail.partial ? (
                <div className="detail-availability">
                  <span className="avail-badge available">
                    貸出可能: {detail.availableCopies}
                  </span>
                  <span className="avail-badge lent">
                    貸出中: {detail.lentCopies}
                  </span>
                  <span className="avail-badge">予約: {detail.reservations}</span>
                </div>
              ) : (
                <p className="detail-loading"><span className="spinner" /> 所蔵情報を読み込み中…</p>
              )}
            </div>
            <LibraryLink bookId={detail.bookId} className="detail-library-link" />
          </div>
        </div>

        {detail.partial && (
          <section className="detail-section">
            <div className="detail-loading-skeleton" />
          </section>
        )}

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
                {detail.holdings.map((h) => (
                  <tr key={`${h.library}-${h.location}-${h.status}`}>
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
      <Footer />
    </main>
  );
}
