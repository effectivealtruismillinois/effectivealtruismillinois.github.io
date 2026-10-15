export type DonationMetadata = { country: string; browser: string; device: string };

// Use only broad categories from the ordinary request, never a device fingerprint.
export function donationMetadata(request: Request): DonationMetadata {
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 512);
  const edgeCountry = (request as Request & { cf?: { country?: string } }).cf?.country
    ?? request.headers.get("cf-ipcountry") ?? "";
  const country = /^[A-Z]{2}$/.test(edgeCountry) && edgeCountry !== "XX" ? edgeCountry : "Unknown";
  let browser = "Other";
  if (/Edg(?:e|A|iOS)?\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera|OPiOS\//i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser\//i.test(ua)) browser = "Samsung Internet";
  else if (/Firefox\/|FxiOS\//i.test(ua)) browser = "Firefox";
  else if (/Chrome\/|CriOS\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  let device = "Other";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) device = "Tablet";
  else if (/Mobile|iPhone|iPod/i.test(ua)) device = "Mobile";
  else if (/Windows|Macintosh|X11|Linux/i.test(ua)) device = "Desktop";
  return { country, browser, device };
}

export function skipDonationAnalytics(request: Request): boolean {
  return request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1"
    || /bot|crawler|spider|headless|slurp|facebookexternalhit/i.test(request.headers.get("user-agent") ?? "");
}
