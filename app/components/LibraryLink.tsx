const LIBRARY_DETAIL_URL =
  "https://www.lib-itoshima.jp/WebOpac/webopac/searchdetail.do";

export function LibraryLink({
  bookId,
  className,
}: {
  bookId: string;
  className?: string;
}) {
  if (!bookId) return null;

  return (
    <form
      method="POST"
      action={LIBRARY_DETAIL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <input type="hidden" name="biblioid" value={bookId} />
      <input type="hidden" name="count" value="999" />
      <input type="hidden" name="screen" value="142" />
      <input type="hidden" name="histnum" value="2" />
      <input type="hidden" name="listtype" value="0" />
      <button type="submit" className="library-link">
        図書館サイトで見る ↗
      </button>
    </form>
  );
}
