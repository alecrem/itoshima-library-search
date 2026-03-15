import { Form, useNavigation } from "react-router";

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
        />
        <button type="submit" className="search-button" disabled={isSearching}>
          {isSearching ? "検索中…" : "検索"}
        </button>
      </Form>
      {loading && query && (
        <p className="search-meta">
          {`${(page - 1) * 10 + 1}〜${page * 10}件目を読み込み中…`}
        </p>
      )}
      {!loading && total !== null && (
        <p className="search-meta">
          {total > 0
            ? `${total}件中 ${(page - 1) * 10 + 1}〜${Math.min(page * 10, total)}件目`
            : "結果が見つかりませんでした"}
        </p>
      )}
    </div>
  );
}
