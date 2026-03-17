import { PAGE_SIZE, type SearchFilters } from "./constants";

const BASE_URL = "https://www.lib-itoshima.jp/WebOpac/webopac";
const SEARCH_URL = `${BASE_URL}/searchinput.do`;
const DETAIL_URL = `${BASE_URL}/searchdetail.do`;
const FLOOR_MAP_URL = `${BASE_URL}/searchdetailplace.do`;

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
    publish: "",
    pubflg: "",
    publishid: "",
    isbn: "",
    bunrui: "",
    bunruicode: "",
    recommend: "",
    bkskbn: "",
    btskbn: "",
    bkskbnHdn: "01:02:03:",
    btskbnHdn: "11:12:23:34:",
    bkskbnRange: "",
    btskbnRange: "",
    ...overrides,
  });
}

export async function fetchSearchResults(
  filters: SearchFilters,
  page = 1,
  count = PAGE_SIZE
): Promise<string> {
  const overrides: Record<string, string> = {
    page: String(page),
    count: String(count),
    keyword: filters.keyword,
  };

  if (filters.author) overrides.author = filters.author;
  if (filters.yearFrom) {
    overrides.publiy1 = filters.yearFrom;
    overrides.publiy2 = "01";
  }
  if (filters.yearTo) {
    overrides.publiy3 = filters.yearTo;
    overrides.publiy4 = "12";
  }
  if (filters.materialTypes.length > 0) overrides.btskbn = filters.materialTypes.join("");

  const body = searchParams(overrides);
  for (const branch of filters.branches) {
    body.append("kan", branch);
  }

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

async function establishSession(): Promise<string> {
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
  await searchResponse.text();

  if (!sessionId) {
    throw new Error("Failed to establish library session");
  }

  return sessionId;
}

export async function fetchBookDetail(bookId: string): Promise<string> {
  const sessionId = await establishSession();
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

export async function fetchFloorMap(
  biblioid: string,
  lcdcd: string,
  doclno: string,
  displcs: string,
): Promise<string> {
  const sessionId = await establishSession();
  const body = new URLSearchParams({
    biblioid,
    dispHaikaLcsCd: lcdcd,
    docLno: doclno,
    displcs,
    page: "1",
  });

  const response = await fetch(FLOOR_MAP_URL, {
    method: "POST",
    headers: {
      ...COMMON_HEADERS,
      Cookie: `JSESSIONID=${sessionId}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Floor map fetch failed: ${response.status}`);
  }

  return response.text();
}
