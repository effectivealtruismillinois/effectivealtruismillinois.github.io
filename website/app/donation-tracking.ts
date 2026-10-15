let lastClick = -Infinity;

export function trackDonationClick() {
  const now = performance.now();
  // Suppress accidental double taps using memory only. Refreshing resets this.
  if (now - lastClick < 3000) return;
  lastClick = now;
  try {
    void fetch("/api/donation-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: crypto.randomUUID() }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Statistics must never prevent someone opening the donation page.
  }
}
