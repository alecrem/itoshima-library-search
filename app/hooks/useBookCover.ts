import { useEffect, useState } from "react";
import { cacheCoverUrl, getCachedCoverUrl } from "~/lib/book-cache";

export function useBookCover(isbn: string) {
  const [coverUrl, setCoverUrl] = useState<string | null>(
    () => getCachedCoverUrl(isbn)
  );

  useEffect(() => {
    if (!isbn || getCachedCoverUrl(isbn)) return;
    let cancelled = false;
    fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=items/volumeInfo/imageLinks`
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const thumb = d?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (thumb) {
          const url = thumb.replace("http://", "https://");
          cacheCoverUrl(isbn, url);
          setCoverUrl(url);
        }
      })
      .catch((e) => console.warn("Cover fetch failed:", isbn, e));
    return () => {
      cancelled = true;
    };
  }, [isbn]);

  return coverUrl;
}
