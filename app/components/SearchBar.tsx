import { Form, useNavigation } from "react-router";
import { PAGE_SIZE } from "~/lib/constants";

export function SearchBar({
  query,
  total,
  page,
  loading,
}: {
  query: string;
  total: number | null;
  page: number;
  loading?: boolean;
}) {
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";

  return (
    <div className="search-bar">
      <Form method="get" className="search-form">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="本を検索… (例: 宮沢賢治)"
          aria-label="検索キーワード"
          className="search-input"
          autoFocus={!query}
        />
        <button type="submit" className="search-button" disabled={isSearching}>
          {isSearching ? "検索中…" : "検索"}
        </button>
      </Form>
      <div aria-live="polite" aria-atomic="true">
        {loading && query && (
          <p className="search-meta loading-meta">
            <span className="spinner" /> {`${(page - 1) * PAGE_SIZE + 1}〜${page * PAGE_SIZE}件目を読み込み中…`}
          </p>
        )}
        {!loading && total !== null && (
          <p className="search-meta">
            {total > 0
              ? `${total}件中 ${(page - 1) * PAGE_SIZE + 1}〜${Math.min(page * PAGE_SIZE, total)}件目`
              : "結果が見つかりませんでした"}
          </p>
        )}
      </div>
    </div>
  );
}
