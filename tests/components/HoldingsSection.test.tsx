// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoldingsSection } from "../../app/components/HoldingsSection";
import type { Holding } from "../../app/lib/parser.server";

const holdings: Holding[] = [
  {
    library: "本館",
    type: "児童",
    location: "マンガコーナー",
    status: "貸出中です",
    materialNo: "120105580",
  },
  {
    library: "二丈館",
    type: "一般",
    location: "マンガコーナー",
    status: "貸出できます",
    materialNo: "110005154",
    floorMapParams: { lcdcd: "30", doclno: "31985", displcs: "二丈館" },
  },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify({ floors: [] })))
  ));
});

describe("HoldingsSection", () => {
  it("renders all holdings", () => {
    render(<HoldingsSection holdings={holdings} bookId="16" />);

    expect(screen.getByText("本館")).toBeInTheDocument();
    expect(screen.getByText("二丈館")).toBeInTheDocument();
    expect(screen.getByText("貸出中です")).toBeInTheDocument();
    expect(screen.getByText("貸出できます")).toBeInTheDocument();
  });

  it("shows 地図 button only for holdings with floorMapParams", () => {
    render(<HoldingsSection holdings={holdings} bookId="16" />);

    const buttons = screen.getAllByRole("button", { name: "地図" });
    expect(buttons).toHaveLength(1);
  });

  it("applies status-available class for available books", () => {
    render(<HoldingsSection holdings={holdings} bookId="16" />);

    const available = screen.getByText("貸出できます");
    expect(available).toHaveClass("status-available");
  });

  it("applies status-lent class for lent books", () => {
    render(<HoldingsSection holdings={holdings} bookId="16" />);

    const lent = screen.getByText("貸出中です");
    expect(lent).toHaveClass("status-lent");
  });

  it("toggles floor map on button click", async () => {
    const user = userEvent.setup();
    render(<HoldingsSection holdings={holdings} bookId="16" />);

    const button = screen.getByRole("button", { name: "地図" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
