import * as cheerio from "cheerio";
import type { Element } from "domhandler";

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  authorId: string;
  publisher: string;
  year: string;
  type: string;
  isbn: string;
  available: boolean;
};

export type SearchResults = {
  total: number;
  page: number;
  totalPages: number;
  books: Book[];
};

export function parseSearchResults(html: string): SearchResults {
  const $ = cheerio.load(html);

  const extractLabelText = (
    $lis: cheerio.Cheerio<Element>,
    label: string
  ): string => {
    const li = $lis
      .filter((_i, el) => $(el).text().startsWith(label))
      .first();
    return li.text().replace(label, "").trim();
  };

  const metaText = $(".displayCondition").first().text();
  const totalMatch = metaText.match(/検索結果【(\d+)】/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const pageMatch = metaText.match(/\((\d+)\/(\d+)ページ\)/);
  const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
  const totalPages = pageMatch ? parseInt(pageMatch[2], 10) : 1;

  const books: Book[] = [];

  $("#sheet .bookcard_temp").each((_i, el) => {
    const $card = $(el);

    const wrapperEl = $card.find('div[id^="bookcard_item_"]').first();
    const wrapperId = wrapperEl.attr("id") ?? "";
    const id = wrapperId.replace("bookcard_item_", "");

    const title = $card.find("h3").first().text().trim();
    const subtitle = $card.find("h4").first().text().trim();

    const $lis = $card.find("ul li");

    const authorLi = $lis
      .filter((_i, li) => $(li).text().startsWith("著者："))
      .first();
    const authorLink = authorLi.find("a").first();
    const author = authorLink.text().trim();
    const authorHref = authorLink.attr("href") ?? "";
    const authorIdMatch = authorHref.match(/list_author\('(\d+)'\)/);
    const authorId = authorIdMatch ? authorIdMatch[1] : "";

    const publisher = extractLabelText($lis, "出版者：");
    const year = extractLabelText($lis, "出版年：");
    const type = extractLabelText($lis, "資料種別：");

    const imgEl = $card.find('img[id^="img_"]').first();
    const imgId = imgEl.attr("id") ?? "";
    const isbn = imgId.replace("img_", "");

    const available = $card.find(".bookcard_situation").length === 0;

    books.push({
      id,
      title,
      subtitle,
      author,
      authorId,
      publisher,
      year,
      type,
      isbn,
      available,
    });
  });

  return { total, page, totalPages, books };
}

export type Holding = {
  library: string;
  type: string;
  location: string;
  status: string;
  materialNo: string;
  floorMapParams?: {
    lcdcd: string;
    doclno: string;
    displcs: string;
  };
};

export type BookDetail = {
  title: string;
  subtitle: string;
  author: string;
  authorId: string;
  publisher: string;
  year: string;
  description: string;
  otherInfo: string;
  isbn: string;
  reservations: number;
  availableCopies: number;
  lentCopies: number;
  holdings: Holding[];
};

export function parseBookDetail(html: string): BookDetail {
  const $ = cheerio.load(html);

  const title = $("h3 strong span.underline").first().text().trim();
  const subtitle = $(".bookInfoTitle h5").first().text().trim();

  const $table = $("table.bookItemInfo");
  const getField = (label: string): string => {
    const th = $table.find("th").filter((_i, el) => $(el).text().trim() === label);
    return th.next("td").text().trim();
  };

  const authorTd = $table.find("th").filter((_i, el) => $(el).text().trim() === "著者").next("td");
  const authorLink = authorTd.find("a").first();
  const author = authorLink.text().trim();
  const authorHref = authorLink.attr("href") ?? "";
  const authorIdMatch = authorHref.match(/list_author\('(\d+)'\)/);
  const authorId = authorIdMatch ? authorIdMatch[1] : "";

  const publisher = getField("出版者");
  const description = getField("内容紹介");
  const otherInfo = getField("その他");

  // The library's HTML uses an empty <th scope="row"></th> for the year row
  const yearTd = $table.find("th").filter((_i, el) => {
    const text = $(el).text().trim();
    return text === "" || text === "出版年";
  }).next("td").filter((_i, el) => /\d{4}年\d{2}月/.test($(el).text()));
  const year = yearTd.first().text().trim();

  const isbnMatch = otherInfo.match(/【ISBN】([\d-]+)/);
  const isbn = isbnMatch ? isbnMatch[1].replace(/-/g, "") : "";

  const stateText = $(".bookState").text();
  const reservations = parseInt(stateText.match(/予約数：(\d+)/)?.[1] ?? "0", 10);
  const availableCopies = parseInt(stateText.match(/貸出可能数：(\d+)/)?.[1] ?? "0", 10);
  const lentCopies = parseInt(stateText.match(/貸出件数：(\d+)/)?.[1] ?? "0", 10);

  const holdings: Holding[] = [];
  $('table[summary="資料毎の状態表"] tbody tr').each((_i, el) => {
    const $tds = $(el).find("td");
    if ($tds.length >= 6) {
      const holding: Holding = {
        library: $tds.eq(1).text().trim(),
        type: $tds.eq(2).text().trim(),
        location: $tds.eq(3).text().trim(),
        status: $tds.eq(4).text().trim(),
        materialNo: $tds.eq(5).text().trim(),
      };

      const onclick = $tds.find("button[onclick*='action_detailplace_subwindow']").attr("onclick") ?? "";
      const mapMatch = onclick.match(/action_detailplace_subwindow\(\d+,\s*'(\d+)',\s*(\d+),\s*'([^']+)'\)/);
      if (mapMatch) {
        holding.floorMapParams = {
          lcdcd: mapMatch[1],
          doclno: mapMatch[2],
          displcs: mapMatch[3],
        };
      }

      holdings.push(holding);
    }
  });

  return {
    title,
    subtitle,
    author,
    authorId,
    publisher,
    year,
    description,
    otherInfo,
    isbn,
    reservations,
    availableCopies,
    lentCopies,
    holdings,
  };
}