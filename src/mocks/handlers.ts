import { http, HttpResponse } from "msw";
import { serverNow } from "./clock";
import menu from "./data/menu.json";

export const handlers = [
  http.get("/api/menu", () => {
    return HttpResponse.json(menu);
  }),

  http.get("/api/time", () => {
    return HttpResponse.json({ serverTime: new Date(serverNow()).toISOString() });
  }),
];
