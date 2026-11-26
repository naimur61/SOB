import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Header from "./Header";

test("shows the server time in Dhaka", () => {
  // 04:59:59 UTC = 10:59:59 in Dhaka (UTC+6)
  render(<Header serverNow={Date.parse("2026-11-26T04:59:59Z")} />);
  expect(screen.getByText("Server time: 10:59:59")).toBeInTheDocument();
});

test("shows a placeholder before the server answers", () => {
  render(<Header serverNow={null} />);
  expect(screen.getByText("Server time: --:--:--")).toBeInTheDocument();
});
