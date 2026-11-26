import { http, HttpResponse } from "msw";
import menu from "./data/menu.json";

export const handlers = [
  http.get("/api/menu", () => {
    return HttpResponse.json(menu);
  }),
];
