import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { network } from "../mocks/network";
import { server } from "../mocks/server";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
// The mock price endpoint is instant and reliable unless a test says otherwise
beforeEach(() => {
  localStorage.clear();
  Object.assign(network, { minDelay: 0, maxDelay: 0, failRate: 0 });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
