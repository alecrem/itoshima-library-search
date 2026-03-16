import { PAGE_SIZE } from "./constants";

const BASE_URL = "https://www.lib-itoshima.jp/WebOpac/webopac";
const SEARCH_URL = `${BASE_URL}/searchlist.do`;
const DETAIL_URL = `${BASE_URL}/searchdetail.do`;

const COMMON_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
};

function searchParams(overrides: Record<string, string>): URLSearchParams {
  return new URLSearchParams({
    keyword: "",
    keyflg: "and",
    author: "",
    autflg: "and",
    authorid: "",
    publiy1: "",
    publiy2: "",
    publiy3: "",
    publiy4: "",
    allcount: "",
    title: "",
    titflg: "",
    publish: "",
    pubflg: "",
    publishid: "",
    isbn: "",
    bunrui: "",
    bunruicode: "",
    recommend: "",
    syubetu: "",
    prize: "",
    przflg: "",
    nasflg: "",
    seiky1: "",
    kanflg: "",
    media: "",
    order: "",
    man: "",
    ...overrides,
  });
}

export async function fetchSearchResults(
  keyword: string,
  page = 1,
  count = PAGE_SIZE
): Promise<string> {
  const body = searchParams({
    page: String(page),
    count: String(count),
    keyword,
  });

  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Library search failed: ${response.status}`);
  }

  return response.text();
}

function extractSessionCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/JSESSIONID=([^;]+)/);
  return match ? match[1] : "";
}

export async function fetchBookDetail(bookId: string): Promise<string> {
  // Step 1: establish a session via a dummy search
  const searchBody = searchParams({
    page: "1",
    count: "1",
    keyword: "*",
  });

  const searchResponse = await fetch(SEARCH_URL, {
    method: "POST",
    headers: COMMON_HEADERS,
    body: searchBody.toString(),
    redirect: "manual",
  });

  const sessionId = extractSessionCookie(searchResponse);
  // Consume body to avoid leaking
  await searchResponse.text();

  if (!sessionId) {
    throw new Error("Failed to establish library session");
  }

  // Step 2: fetch detail page using session cookie
  const detailBody = new URLSearchParams({
    biblioid: bookId,
    count: "999",
    screen: "142",
    histnum: "2",
    listtype: "0",
  });

  const detailResponse = await fetch(DETAIL_URL, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      Cookie: `JSESSIONID=${sessionId}`,
    },
    body: detailBody.toString(),
  });

  if (!detailResponse.ok) {
    throw new Error(`Library detail fetch failed: ${detailResponse.status}`);
  }

  return detailResponse.text();
}
