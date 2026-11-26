import { delay, http, HttpResponse } from "msw";
import { priceCart } from "../engine/pricing";
import type { Menu } from "../types/menu";
import type { Cart, CartLine } from "../types/price";
import { availableStock, editItem, removeItem, reserveItem } from "./cart";
import { checkout, type Payment } from "./checkout";
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

  http.get("/api/cart", () => {
    return HttpResponse.json(readDb().items);
  }),

  http.put<{ id: string }>("/api/cart/:id", async ({ request, params }) => {
    const line = (await request.json()) as CartLine;

    const result = editItem(params.id, line);
    if ("message" in result) {
      return HttpResponse.json({ message: result.message }, { status: result.status });
    }

    return HttpResponse.json(result.item);
  }),

  http.delete<{ id: string }>("/api/cart/:id", ({ params }) => {
    removeItem(params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/checkout", async ({ request }) => {
    const payment = (await request.json()) as Payment;
    const key = request.headers.get("Idempotency-Key");
    if (!key) {
      return HttpResponse.json({ message: "Idempotency key missing" }, { status: 400 });
    }

    const result = checkout(payment, key);
    if ("message" in result) {
      return HttpResponse.json({ message: result.message }, { status: result.status });
    }

    return HttpResponse.json(result.order, { status: 201 });
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
