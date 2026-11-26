import { getMenu } from "../api/menu";
import { getOrders } from "../api/orders";
import { getServerTime } from "../api/time";
import { runTool, toolDeclarations } from "./tools";

export const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

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
    "Only repeat what the function results say.",
    "Orders store no customer information. If the functions cannot answer the question,",
    "call no function.",
    `The current server time is ${today}. The shop is in Asia/Dhaka.`,
  ].join(" ");
}

async function generate(
  apiKey: string,
  system: string,
  contents: Content[],
): Promise<{ role: string; parts: Part[] }> {
  let res: Response;
  try {
    res = await fetch(GEMINI_URL, {
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
      throw new Error("Gemini quota reached (429). Wait a little and try again.");
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
  const [orders, menu, serverTime] = await Promise.all([getOrders(), getMenu(), getServerTime()]);

  const contents: Content[] = [{ role: "user", parts: [{ text: question }] }];
  let usedTool = false;

  // Ask, run the chosen tools, send the results back, until the model replies in words
  for (let round = 0; round < 3; round++) {
    const reply = await generate(apiKey, instructions(serverTime), contents);
    const calls = reply.parts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));

    if (calls.length === 0) {
      const text = reply.parts
        .filter((part) => !part.thought)
        .map((part) => part.text ?? "")
        .join("");
      return usedTool && text ? text : CANNOT_ANSWER;
    }

    usedTool = true;
    const results = calls.map((call) => ({
      functionResponse: {
        id: call.id,
        name: call.name,
        response: runTool(call.name, call.args ?? {}, orders, menu),
      },
    }));
    // The model's turn is sent back unchanged (it carries a thought signature)
    contents.push(reply, { role: "user", parts: results });
  }

  throw new Error("The assistant could not finish the answer. Please ask again.");
}
