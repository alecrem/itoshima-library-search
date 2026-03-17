import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSearchResults, fetchBookDetail, fetchFloorMap } from "../app/lib/library.server";

function mockResponse(body: string, options: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(body, {
    status: options.status ?? 200,
    headers: options.headers ?? {},
  });
}

function sessionResponse() {
  return mockResponse("", {
    headers: { "set-cookie": "JSESSIONID=TEST_SESSION_ID; Path=/WebOpac" },
  });
}

let fetchCalls: { url: string; init: RequestInit }[];
let fetchResponses: Response[];

beforeEach(() => {
  fetchCalls = [];
  fetchResponses = [];
  vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init: init ?? {} });
    const response = fetchResponses.shift();
    if (!response) throw new Error("No more mock responses");
    return response;
  });
});

describe("fetchSearchResults", () => {
  it("posts to searchinput.do with keyword and page", async () => {
    fetchResponses.push(mockResponse("<html>results</html>"));

    const result = await fetchSearchResults(
      { keyword: "猫", author: "", yearFrom: "", yearTo: "", branches: [], materialTypes: [] },
      2,
      10,
    );

    expect(result).toBe("<html>results</html>");
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toContain("searchinput.do");

    const body = new URLSearchParams(fetchCalls[0].init.body as string);
    expect(body.get("keyword")).toBe("猫");
    expect(body.get("page")).toBe("2");
    expect(body.get("count")).toBe("10");
  });

  it("includes author and year filters", async () => {
    fetchResponses.push(mockResponse(""));

    await fetchSearchResults({
      keyword: "本", author: "太郎", yearFrom: "2020", yearTo: "2025", branches: [], materialTypes: [],
    });

    const body = new URLSearchParams(fetchCalls[0].init.body as string);
    expect(body.get("author")).toBe("太郎");
    expect(body.get("publiy1")).toBe("2020");
    expect(body.get("publiy2")).toBe("01");
    expect(body.get("publiy3")).toBe("2025");
    expect(body.get("publiy4")).toBe("12");
  });

  it("appends branch filters as multiple kan params", async () => {
    fetchResponses.push(mockResponse(""));

    await fetchSearchResults({
      keyword: "本", author: "", yearFrom: "", yearTo: "", branches: ["10", "30"], materialTypes: [],
    });

    const body = new URLSearchParams(fetchCalls[0].init.body as string);
    expect(body.getAll("kan")).toEqual(["10", "30"]);
  });

  it("throws on non-ok response", async () => {
    fetchResponses.push(mockResponse("", { status: 500 }));

    await expect(
      fetchSearchResults({ keyword: "猫", author: "", yearFrom: "", yearTo: "", branches: [], materialTypes: [] }),
    ).rejects.toThrow("Library search failed: 500");
  });
});

describe("fetchBookDetail", () => {
  it("establishes session then fetches detail", async () => {
    fetchResponses.push(sessionResponse());
    fetchResponses.push(mockResponse("<html>detail</html>"));

    const result = await fetchBookDetail("12345");

    expect(result).toBe("<html>detail</html>");
    expect(fetchCalls).toHaveLength(2);

    // First call: session establishment
    expect(fetchCalls[0].url).toContain("searchinput.do");

    // Second call: detail with session cookie
    expect(fetchCalls[1].url).toContain("searchdetail.do");
    const headers = fetchCalls[1].init.headers as Record<string, string>;
    expect(headers.Cookie).toBe("JSESSIONID=TEST_SESSION_ID");

    const body = new URLSearchParams(fetchCalls[1].init.body as string);
    expect(body.get("biblioid")).toBe("12345");
  });

  it("throws when session cannot be established", async () => {
    fetchResponses.push(mockResponse("", { headers: {} }));

    await expect(fetchBookDetail("12345")).rejects.toThrow("Failed to establish library session");
  });

  it("throws on non-ok detail response", async () => {
    fetchResponses.push(sessionResponse());
    fetchResponses.push(mockResponse("", { status: 404 }));

    await expect(fetchBookDetail("12345")).rejects.toThrow("Library detail fetch failed: 404");
  });
});

describe("fetchFloorMap", () => {
  it("establishes session then fetches floor map with correct params", async () => {
    fetchResponses.push(sessionResponse());
    fetchResponses.push(mockResponse("<html>floormap</html>"));

    const result = await fetchFloorMap("16", "30", "31985", "二丈館");

    expect(result).toBe("<html>floormap</html>");
    expect(fetchCalls).toHaveLength(2);

    expect(fetchCalls[1].url).toContain("searchdetailplace.do");
    const headers = fetchCalls[1].init.headers as Record<string, string>;
    expect(headers.Cookie).toBe("JSESSIONID=TEST_SESSION_ID");

    const body = new URLSearchParams(fetchCalls[1].init.body as string);
    expect(body.get("biblioid")).toBe("16");
    expect(body.get("dispHaikaLcsCd")).toBe("30");
    expect(body.get("docLno")).toBe("31985");
    expect(body.get("displcs")).toBe("二丈館");
  });

  it("throws on non-ok floor map response", async () => {
    fetchResponses.push(sessionResponse());
    fetchResponses.push(mockResponse("", { status: 500 }));

    await expect(fetchFloorMap("16", "30", "31985", "二丈館")).rejects.toThrow("Floor map fetch failed: 500");
  });
});
