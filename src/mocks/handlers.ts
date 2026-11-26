import { delay, http, HttpResponse } from "msw";
import { priceCart } from "../engine/pricing";
import type { Menu } from "../types/menu";
import type { Cart } from "../types/price";
import { serverNow } from "./clock";
import menuJson from "./data/menu.json";
import { network } from "./network";

const menu = menuJson as Menu;

export const handlers = [
  http.get("/api/menu", () => {
    return HttpResponse.json(menu);
  }),

  // Reservations will be subtracted here once the cart exists
  http.get("/api/stock", () => {
    return HttpResponse.json(menu.stock);
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
