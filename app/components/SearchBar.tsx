import { useRef, useState } from "react";
import { Form, useNavigation } from "react-router";
import { PAGE_SIZE, BRANCHES, MATERIAL_TYPES, type SearchFilters } from "~/lib/constants";

export function SearchBar({
  filters,
  total,
  page,
  loading,
}: {
  filters: SearchFilters;
  total: number | null;
  page: number;
  loading?: boolean;
}) {
  const navigation = useNavigation();
  const isSearching = navigation.state === "loading";
  const hasSearch = !!(filters.keyword || filters.author || filters.yearFrom || filters.yearTo || filters.branches.length || filters.materialTypes.length);
  const hasAdvancedFilters = !!(filters.author || filters.yearFrom || filters.yearTo || filters.branches.length || filters.materialTypes.length);
  const [open, setOpen] = useState(!hasSearch || hasAdvancedFilters);
  const [keyword, setKeyword] = useState(filters.keyword);
  const [author, setAuthor] = useState(filters.author);
  const [yearFrom, setYearFrom] = useState(filters.yearFrom);
  const [yearTo, setYearTo] = useState(filters.yearTo);
  const [checkedBranches, setCheckedBranches] = useState<string[]>(filters.branches);
  const [checkedTypes, setCheckedTypes] = useState<string[]>(filters.materialTypes);
  const cannotSearch = !keyword.trim() && !author.trim();
  const formRef = useRef<HTMLFormElement>(null);
  const yearFromRef = useRef<HTMLInputElement>(null);
  const yearToRef = useRef<HTMLInputElement>(null);

  function toggleBranch(value: string) {
    setCheckedBranches((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleType(value: string) {
    setCheckedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function resetAll() {
    setKeyword("");
    setAuthor("");
    setYearFrom("");
    setYearTo("");
    if (yearFromRef.current) yearFromRef.current.value = "";
    if (yearToRef.current) yearToRef.current.value = "";
    setCheckedBranches([]);
    setCheckedTypes([]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const str = value.toString().trim();
      if (str) params.set(key, str);
    }
    window.location.href = `/?${params.toString()}`;
  }

  return (
    <div className="search-bar">
      <Form method="get" className="search-form" ref={formRef} onSubmit={handleSubmit}>
        <div className="search-row">
          <div className="clearable-input">
            <input
              type="search"
              name="q"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="本を検索… (例: 宮沢賢治)"
              aria-label="検索キーワード"
              className="search-input"
              autoFocus={!filters.keyword}
            />
            {keyword && (
              <button type="button" className="clear-button" onClick={() => setKeyword("")} aria-label="キーワードをクリア">×</button>
            )}
          </div>
          <button type="submit" className="search-button" disabled={isSearching || cannotSearch}>
            {isSearching ? "検索中…" : "検索"}
          </button>
        </div>

        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          詳細検索 {open ? "▲" : "▼"}
        </button>

        {open && (
          <div className="advanced-filters">
            <div className="filter-row">
              <label htmlFor="author-input" className="filter-label">著者</label>
              <div className="clearable-input">
                <input
                  id="author-input"
                  type="text"
                  name="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="filter-input"
                />
                {author && (
                  <button type="button" className="clear-button" onClick={() => setAuthor("")} aria-label="著者をクリア">×</button>
                )}
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">所蔵館</span>
              <div className="checkbox-group">
                {BRANCHES.map((b) => (
                  <label key={b.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={checkedBranches.includes(b.value)}
                      onChange={() => toggleBranch(b.value)}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
              {checkedBranches.length > 0 && (
                <input type="hidden" name="branch" value={checkedBranches.join(",")} />
              )}
            </div>

            <div className="filter-row">
              <span className="filter-label">出版年</span>
              <div className="year-range">
                <input
                  ref={yearFromRef}
                  type="number"
                  name="yearFrom"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  placeholder="開始年"
                  inputMode="numeric"
                  className="filter-input year-input"
                  aria-label="出版年（開始）"
                />
                <span className="year-separator">〜</span>
                <input
                  ref={yearToRef}
                  type="number"
                  name="yearTo"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  placeholder="終了年"
                  inputMode="numeric"
                  className="filter-input year-input"
                  aria-label="出版年（終了）"
                />
              </div>
            </div>

            <div className="filter-row">
              <span className="filter-label">資料種別</span>
              <div className="checkbox-group">
                {MATERIAL_TYPES.map((t) => (
                  <label key={t.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={checkedTypes.includes(t.value)}
                      onChange={() => toggleType(t.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              {checkedTypes.length > 0 && (
                <input type="hidden" name="type" value={checkedTypes.join(",")} />
              )}
            </div>

            <button type="button" className="reset-button" onClick={resetAll}>
              条件をリセット
            </button>
          </div>
        )}
      </Form>
      <div aria-live="polite" aria-atomic="true">
        {cannotSearch && total === null && (
          <p className="search-hint">キーワードまたは著者を入力してください</p>
        )}
        {loading && filters.keyword && (
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
