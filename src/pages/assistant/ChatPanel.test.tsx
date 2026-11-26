import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ChatPanel from "./ChatPanel";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("shows a clear message when the key is missing", async () => {
  vi.stubEnv("VITE_GEMINI_API_KEY", "");
  render(<ChatPanel />);

  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "How many orders?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));

  expect(await screen.findByText(/Gemini API key is missing/)).toBeInTheDocument();
});

test("an empty question is not sent and the field says why", async () => {
  render(<ChatPanel />);

  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "   " } });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Type a question first.");
  // Nothing was added to the conversation
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
});
