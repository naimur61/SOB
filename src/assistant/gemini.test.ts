import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { reserveItem } from "../mocks/cart";
import { checkout } from "../mocks/checkout";
import { server } from "../mocks/server";
import { askAssistant, CANNOT_ANSWER, GEMINI_URL } from "./gemini";

type Body = { contents: { parts: { functionResponse?: { response: object } }[] }[] };

let requests: string[] = [];

beforeEach(() => {
  requests = [];
  vi.stubEnv("VITE_GEMINI_API_KEY", "test-key");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const modelSays = (part: object) =>
  HttpResponse.json({ candidates: [{ content: { role: "model", parts: [part] } }] });

// A fake model: picks the given tool, then repeats the tool result as its answer
function fakeGemini(name: string, args: object = {}) {
  server.use(
    http.post(GEMINI_URL, async ({ request }) => {
      const body = (await request.json()) as Body;
      requests.push(JSON.stringify(body));

      const result = body.contents.at(-1)!.parts[0].functionResponse;
      if (!result) return modelSays({ functionCall: { id: "1", name, args } });
      return modelSays({ text: JSON.stringify(result.response) });
    }),
  );
}

test("TC-18: one checkout adds exactly one order, without a reload", async () => {
  fakeGemini("countOrders");
  expect(await askAssistant("How many orders?")).toBe('{"orders":6}');

  reserveItem({ config: { toast: 1, scrambled: 2, sausage: 1 }, quantity: 1 }, "item");
  checkout({ paymentMethod: "cash", couponCode: "" }, "pay");

  expect(await askAssistant("How many orders?")).toBe('{"orders":7}');
});

test("TC-19: the best seller comes from our stats function", async () => {
  fakeGemini("bestSellingOption");

  expect(await askAssistant("Best seller?")).toBe('{"options":["Fried"],"units":10}');
});

test("orders on a date", async () => {
  fakeGemini("ordersOnDate", { date: "2026-11-20" });

  expect(await askAssistant("Orders on 20 November?")).toContain('"count":2');
});

test("raw orders are never sent to the model", async () => {
  fakeGemini("totalRevenue");
  await askAssistant("Revenue?");

  expect(requests.join()).not.toContain("ORD-1001");
});

test("TC-20: with no tool, the model's own words are not shown", async () => {
  server.use(http.post(GEMINI_URL, () => modelSays({ text: "Your best customer is Karim." })));

  expect(await askAssistant("Who is our best customer?")).toBe(CANNOT_ANSWER);
});

test("missing key", async () => {
  vi.stubEnv("VITE_GEMINI_API_KEY", "");

  await expect(askAssistant("Hi")).rejects.toThrow("key is missing");
});

test.each([
  [400, "API_KEY_INVALID", "key is invalid"],
  [403, "PERMISSION_DENIED", "key is invalid"],
  [429, "RESOURCE_EXHAUSTED", "quota"],
  [500, "INTERNAL", "status 500"],
])("error %i %s", async (status, reason, message) => {
  server.use(http.post(GEMINI_URL, () => HttpResponse.json({ error: { reason } }, { status })));

  await expect(askAssistant("Hi")).rejects.toThrow(message);
});

test("network error", async () => {
  server.use(http.post(GEMINI_URL, () => HttpResponse.error()));

  await expect(askAssistant("Hi")).rejects.toThrow("Network error");
});
