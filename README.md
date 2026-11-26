# Smart Order Builder

Build a breakfast item, reserve its ingredients, check out, and ask a chat assistant about sales.
There is no real backend: MSW (Mock Service Worker) plays the server.

Built with React 19, Vite, TypeScript, TanStack Query (server data), React Hook Form (forms) and
Vitest.

## Setup

Needs Node 22.12 or newer.

```bash
npm install
cp .env.example .env.local   # then put your Gemini key after VITE_GEMINI_API_KEY=
npm run dev
```

| Command           | What it does                            |
| ----------------- | --------------------------------------- |
| `npm test`        | Runs all tests                          |
| `npm run answers` | Prints the numbers used in `ANSWERS.md` |
| `npm run build`   | Type-checks and builds                  |
| `npm run lint`    | Lints                                   |

## Folders

```
src/
  app/          App shell: page switching, header, server clock
  pages/        one folder per page: the page file and the components only it uses
    builder/    BuilderPage and its option, price and stock pieces
    cart/       CartPage, cart rows, summary, pay button
    orders/     OrdersPage, order list, download button
    assistant/  ChatPanel, the Gemini call and the tools it can pick
  hooks/        the shared TanStack Query pieces: useFetchData, useApiMutation, queryClient
  lib/          request(): the one function every server call goes through
  engine/       pure functions: rules, stock, pricing, order, stats
  types/        data shapes
  utils/        money, time, orders file
  mocks/        the mock server: handlers.ts (routes), backend/ (its logic), data/ (menu, seed orders)
  test/         test setup and helpers
```

## How it works

**Flow.** A page is made of the components in its folder. It loads data with `useFetchData` and
changes it with `useApiMutation`. Both call `request()` in `lib/request.ts`, and MSW answers.
Every form (question, coupon, payment method, quantity) uses React Hook Form.

**Data.** `src/mocks/data/menu.json` holds groups, options, rules, stock, promotions, VAT and payment
methods. Components and engines read ids and limits from it, so another menu works without code
changes. Seed orders are in `src/mocks/data/orders.seed.json`. All money is integer poisha.

**Rules** (`engine/rules.ts`). `validate(config, groups, rules)` returns every violation with the
group or rule id.

**Stock** (`engine/stock.ts`). Works per ingredient. While editing, available stock is what is left
plus what the item already holds.

**Pricing** (`engine/pricing.ts`). `priceCart(cart, menu, promos, serverTime)` is pure. The mock
server, the cart page and the tests all use it.

**Mock server** (`mocks/`). The cart, orders and sold stock are kept in `localStorage`. Reservations,
edits and checkout check everything first and then save with one write. The server clock runs 90
seconds ahead of the browser.

| Endpoint                                    | Purpose                                                                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/menu`, `/api/time`, `/api/stock`  | Menu, server time, available stock                                                                                                                                      |
| `POST /api/price`                           | Price preview (200-1500 ms, fails 15% of the time)                                                                                                                      |
| `GET /api/cart`, `POST /api/cart`           | List items, reserve an item (idempotency key). `POST` fails 10% of the time (`reserveFailRate` in `src/mocks/backend/network.ts`) and nothing is reserved when it fails |
| `PUT /api/cart/:id`, `DELETE /api/cart/:id` | Edit or remove an item                                                                                                                                                  |
| `POST /api/checkout`, `GET /api/orders`     | Pay (idempotency key), list orders                                                                                                                                      |

**Assistant** (`pages/assistant/`). Gemini only chooses a tool and words its result. The tools in
`tools.ts` run the functions in `engine/stats.ts` on the latest orders. Raw orders are never sent.
If the model chooses no tool, its text is dropped and a fixed "cannot answer" message is shown.

To start again with only the seed data, clear the `sob-db` key in the browser's local storage.

## Trade-offs

- `localStorage` stands in for a database. Two tabs writing at exactly the same moment are not locked
  against each other.
- No router: the current page is React state.
- The cart summary is calculated in the browser from server time. Checkout calculates it again on the
  server, and that result is what gets stored.
- Editing an item keeps its original expiry time.
- Checkout also clears expired items from the cart. They are not part of the order.
- Each chat question is answered on its own, without earlier messages.
- The Dhaka offset used for new order times is fixed at +06:00.

## Unfinished

- Part G: cart version numbers for stale tabs, and keeping an unfinished configuration after a
  refresh. Unfinished selections are also lost when switching pages.
- Changes made in another tab show up only after switching pages or when an action is refused.
- The "cannot answer" message of the assistant is in English only.

## Hours spent

About 7 hours.
