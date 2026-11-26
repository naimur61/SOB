import { http, HttpResponse } from "msw";
import { serverNow } from "./clock";
import menu from "./data/menu.json";

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
];
