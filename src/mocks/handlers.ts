import { delay, http, HttpResponse } from "msw";
import { priceCart } from "../engine/pricing";
import type { Menu } from "../types/menu";
import type { Cart, CartLine } from "../types/price";
import { availableStock, reserveItem } from "./cart";
import { serverNow } from "./clock";
import menuJson from "./data/menu.json";
import { readDb } from "./db";
import { network } from "./network";

const menu = menuJson as Menu;

export const handlers = [
  http.get("/api/menu", () => {
    return HttpResponse.json(menu);
  }),

  http.get("/api/stock", () => {
    return HttpResponse.json(availableStock(readDb().items));
  }),

  http.post("/api/cart", async ({ request }) => {
    const line = (await request.json()) as CartLine;
    const key = request.headers.get("Idempotency-Key");
    if (!key) {
      return HttpResponse.json({ message: "Idempotency key missing" }, { status: 400 });
    }

    const result = reserveItem(line, key);
    if ("message" in result) {
      return HttpResponse.json({ message: result.message }, { status: result.status });
    }

    return HttpResponse.json(result.item, { status: 201 });
  }),

  http.get("/api/time", () => {
    return HttpResponse.json({ serverTime: new Date(serverNow()).toISOString() });
  }),

  http.post("/api/price", async ({ request }) => {
    const cart = (await request.json()) as Cart;
    const { minDelay, maxDelay, failRate } = network;
    await delay(minDelay + Math.random() * (maxDelay - minDelay));

    if (Math.random() < failRate) {
      return HttpResponse.json({ message: "Price service failed" }, { status: 503 });
    }

    return HttpResponse.json(priceCart(cart, menu, menu.promotions, serverNow()));
  }),
];
