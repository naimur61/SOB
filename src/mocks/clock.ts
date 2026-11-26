// The mock server's clock runs 90 seconds ahead of the browser.
// The app must never trust Date.now() for anything time-related.
export const SERVER_AHEAD_MS = 90_000;

export function serverNow() {
  return Date.now() + SERVER_AHEAD_MS;
}
