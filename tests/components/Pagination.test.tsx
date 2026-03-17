// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Pagination } from "../../app/components/Pagination";

const defaultFilters = {
  keyword: "猫", author: "", yearFrom: "", yearTo: "", branches: [], materialTypes: [],
};

function renderPagination(page: number, totalPages: number) {
  return render(
    <MemoryRouter>
      <Pagination filters={defaultFilters} page={page} totalPages={totalPages} />
    </MemoryRouter>
  );
}

describe("Pagination", () => {
  it("returns null when totalPages is 1", () => {
    const { container } = renderPagination(1, 1);
    expect(container.innerHTML).toBe("");
  });

  it("renders all pages when total <= 7", () => {
    renderPagination(3, 5);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it("marks current page with aria-current", () => {
    renderPagination(3, 5);

    const current = screen.getByText("3");
    expect(current).toHaveAttribute("aria-current", "page");

    const other = screen.getByText("1");
    expect(other).not.toHaveAttribute("aria-current");
  });

  it("shows prev/next links when applicable", () => {
    renderPagination(3, 10);

    expect(screen.getByText("← 前")).toBeInTheDocument();
    expect(screen.getByText("次 →")).toBeInTheDocument();
  });

  it("hides prev on first page", () => {
    renderPagination(1, 10);

    expect(screen.queryByText("← 前")).not.toBeInTheDocument();
    expect(screen.getByText("次 →")).toBeInTheDocument();
  });

  it("hides next on last page", () => {
    renderPagination(10, 10);

    expect(screen.getByText("← 前")).toBeInTheDocument();
    expect(screen.queryByText("次 →")).not.toBeInTheDocument();
  });

  it("shows ellipsis for large page counts", () => {
    renderPagination(5, 20);

    const ellipses = screen.getAllByText("…");
    expect(ellipses.length).toBe(2);
  });

  it("includes correct href with filters", () => {
    renderPagination(2, 5);

    const link = screen.getByText("3").closest("a");
    expect(link).toHaveAttribute("href", "/?q=%E7%8C%AB&page=3");
  });
});
