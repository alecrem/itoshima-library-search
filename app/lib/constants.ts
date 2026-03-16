export const PAGE_SIZE = 10;

export type SearchFilters = {
  keyword: string;
  author: string;
  yearFrom: string;
  yearTo: string;
  branches: string[];
  materialTypes: string[];
};

export const EMPTY_FILTERS: SearchFilters = {
  keyword: "",
  author: "",
  yearFrom: "",
  yearTo: "",
  branches: [],
  materialTypes: [],
};

export const BRANCHES = [
  { value: "10", label: "本館" },
  { value: "30", label: "二丈館" },
  { value: "40", label: "志摩館" },
] as const;

export const MATERIAL_TYPES = [
  { value: "11:", label: "一般図書" },
  { value: "12:", label: "児童図書" },
  { value: "23:", label: "雑誌" },
  { value: "34:", label: "映像・音楽" },
] as const;

export function filtersToSearchParams(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.author) params.set("author", filters.author);
  if (filters.yearFrom) params.set("yearFrom", filters.yearFrom);
  if (filters.yearTo) params.set("yearTo", filters.yearTo);
  if (filters.branches.length > 0) params.set("branch", filters.branches.join(","));
  if (filters.materialTypes.length > 0) params.set("type", filters.materialTypes.join(","));
  return params.toString();
}
