import { request } from "../hooks/TanstackQueries/controller/fetchGetData";
import type { Menu } from "../types/menu";
import type { Order } from "../types/order";
import { runTool, toolDeclarations } from "./tools";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Flash models, tried in this order. Each one has its own free daily quota,
// so when one is busy (503) or out of quota (429) the next one answers.
export const MODELS = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash-lite"];

// Matches every model, for the tests
export const GEMINI_URL = `${GEMINI_BASE}/*`;

// Busy or out of quota: worth asking the next model
class BusyError extends Error {}

// Shown whenever no tool fits. The model's own words are never used then,
// so it cannot make up a customer, a name or a number.
export const CANNOT_ANSWER =
  "I can't answer that from the sales data. Orders store no customer information. " +
  "You can ask about the number of orders, revenue, average order value, best-selling " +
  "option, payment methods, the coupon, or the orders on a date.";

type FunctionCall = { id?: string; name: string; args?: Record<string, unknown> };
type Part = { text?: string; thought?: boolean; functionCall?: FunctionCall };
type Content = { role: string; parts: object[] };

function instructions(today: string) {
  return [
    "You answer questions from shop staff about sales.",
    "Always get facts by calling a function. Never calculate or guess numbers yourself.",
    "Only repeat what the function results say. Reply in plain text, without markdown.",
    "Orders store no customer information. If the functions cannot answer the question,",
    "call no function.",
    `The current server time is ${today}. The shop is in Asia/Dhaka.`,
  ].join(" ");
}

async function generate(
  model: string,
  apiKey: string,
  system: string,
  contents: Content[],
): Promise<{ role: string; parts: Part[] }> {
  let res: Response;
  try {
    res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        tools: [{ functionDeclarations: toolDeclarations }],
      }),
    });
  } catch {
    throw new Error("Network error: could not reach Gemini. Check your connection.");
  }

  if (!res.ok) {
    const details = await res.text();
    if (res.status === 429) {
      throw new BusyError("Gemini quota reached (429). Wait a little and try again.");
    }
    if (res.status === 503) {
      throw new BusyError("Gemini is busy right now (503). Please try again in a moment.");
    }
    if (res.status === 401 || res.status === 403 || details.includes("API_KEY_INVALID")) {
      throw new Error("The Gemini API key is invalid. Check VITE_GEMINI_API_KEY in .env.local.");
    }
    throw new Error(`Gemini request failed (status ${res.status}).`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content;
  return { role: "model", ...content, parts: content?.parts ?? [] };
}

export async function askAssistant(question: string): Promise<string> {
  const apiKey: string | undefined = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env.local and restart the app.",
    );
  }

  // Read fresh every time, so new checkouts are included
  const [orders, menu, { serverTime }] = await Promise.all([
    request<Order[]>("orders"),
    request<Menu>("menu"),
    request<{ serverTime: string }>("time"),
  ]);

  // The whole question starts again on the next model, never half on one and half on another
  for (const model of MODELS) {
    try {
      return await answer(model, apiKey, question, orders, menu, serverTime);
    } catch (err) {
      if (!(err instanceof BusyError) || model === MODELS.at(-1)) throw err;
    }
  }
  throw new Error("No Gemini model is configured.");
}

async function answer(
  model: string,
  apiKey: string,
  question: string,
  orders: Order[],
  menu: Menu,
  serverTime: string,
): Promise<string> {
  const contents: Content[] = [{ role: "user", parts: [{ text: question }] }];
  const toolResults: object[] = [];

  // Ask, run the chosen tools, send the results back, until the model replies in words
  for (let round = 0; round < 3; round++) {
    const reply = await generate(model, apiKey, instructions(serverTime), contents);
    const calls = reply.parts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));

    if (calls.length === 0) {
      const text = reply.parts
        .filter((part) => !part.thought)
        .map((part) => part.text ?? "")
        .join("");
      if (toolResults.length === 0 || !text) return CANNOT_ANSWER;
      return onlyKnownNumbers(text, question, toolResults) ? text : plainText(toolResults);
    }

    const results = calls.map((call) => ({
      functionResponse: {
        id: call.id,
        name: call.name,
        response: runTool(call.name, call.args ?? {}, orders, menu),
      },
    }));
    toolResults.push(...results.map((result) => result.functionResponse.response));
    // The model's turn is sent back unchanged (it carries a thought signature)
    contents.push(reply, { role: "user", parts: results });
  }

  throw new Error("The assistant could not finish the answer. Please ask again.");
}

// All numbers in a text, with Bangla digits read as 0-9 and "4,995.00" read as 4995
function numbersIn(text: string) {
  const latin = text.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  return (latin.match(/\d[\d,]*(\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
}

// The model may only repeat numbers that our functions (or the question) gave it
function onlyKnownNumbers(text: string, question: string, toolResults: object[]) {
  const known = new Set(numbersIn(question + JSON.stringify(toolResults)));
  return numbersIn(text).every((n) => known.has(n));
}

// Used when the model changed a number: the function results, shown as they are
function plainText(value: unknown): string {
  if (Array.isArray(value)) return value.map(plainText).join("; ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${plainText(item)}`)
      .join(", ");
  }
  return String(value);
}
