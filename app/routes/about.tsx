import { Link } from "react-router";
import { Footer } from "~/components/Footer";
import { ThemeToggle } from "~/components/ThemeToggle";
import { BookIcon } from "~/components/BookIcon";

export function meta() {
  return [
    { title: "このサイトについて | 糸島図書館 非公式検索" },
    { name: "description", content: "Code for Itoshimaによる糸島市立図書館の非公式検索ツールについて" },
  ];
}

export default function About() {
  return (
    <main className="app-container">
      <header className="app-header">
        <h1>
          <Link to="/"><BookIcon className="header-icon" />糸島図書館 非公式検索</Link>
        </h1>
        <ThemeToggle />
      </header>

      <article className="about-page">
        <h2>このサイトについて</h2>

        <section className="about-section">
          <p>
            糸島市立図書館の公式サイトはスマートフォンでの操作がやや不便なため、
            もっと使いやすい検索ツールを作りました。
          </p>
          <ul className="about-features">
            <li>画面全体を読み込み直さず、検索結果や書籍の詳細をすばやく表示</li>
            <li>書籍の配架場所をポップアップなしでフロアマップ上に表示</li>
            <li>検索結果や書籍ページのURLをそのまま共有できる</li>
          </ul>
          <p>
            このサイトは糸島市立図書館の公式サイトではありません。
            蔵書データは
            <a
              href="https://itoshima.libweb.jp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              図書館の公式サイト
            </a>
            から取得しています。
          </p>
        </section>

        <section className="about-section">
          <h3>このサイトのいいところ</h3>
          <ul className="about-checklist">
            <li>オープンソース</li>
            <li>Cookieなし・トラッキングなし</li>
            <li>個人情報の収集なし</li>
            <li>広告なし</li>
            <li>無料</li>
            <li>お金にならない</li>
          </ul>
        </section>

        <section className="about-section about-cfi">
          <div>
            <h3>Code for Itoshima</h3>
            <p>
              糸島に住む仲間の暮らしをちょっと便利にするために、ボランティアで活動しています。
              一緒に手伝ったり、学んだりしませんか？
              プロジェクトのアイデアや困りごとがあれば、ぜひ声をかけてください。
            </p>
            <p>
              <a
                href="https://github.com/codeforitoshima/itoshima-library-search"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
                codeforitoshima/itoshima-library-search
              </a>
            </p>
          </div>
          <img src="/code-for-itoshima.png" alt="Code for Itoshima" className="about-cfi-logo" />
        </section>
      </article>
      <Footer />
    </main>
  );
}
