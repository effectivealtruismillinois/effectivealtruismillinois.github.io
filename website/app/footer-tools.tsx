"use client";
import { useRef, useState, type FormEvent } from "react";

export function FooterTools() {
  const feedback = useRef<HTMLDialogElement>(null), privacy = useRef<HTMLDialogElement>(null);
  const submissionId = useRef<string | null>(null);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState("");
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || sent) return;
    setBusy(true); setError("");
    try {
      submissionId.current ??= crypto.randomUUID();
      const form = e.currentTarget;
      const response = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        body: JSON.stringify({ id: submissionId.current, message, website: (form.elements.namedItem("website") as HTMLInputElement).value }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "We couldn’t save your feedback. Please try again.");
      setSent(true); setMessage("");
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn’t save your feedback. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="footer-tools">
    <button className="footer-link" onClick={() => { if (sent) { setSent(false); submissionId.current = null; } setError(""); feedback.current?.showModal(); }}>Give the site maker feedback</button>
    <button className="footer-link" onClick={() => privacy.current?.showModal()}>Privacy</button>
    <dialog ref={feedback} className="footer-dialog" aria-labelledby="feedback-heading">
      <button className="dialog-close" aria-label="Close feedback" onClick={() => feedback.current?.close()}>×</button>
      <h2 id="feedback-heading">Give feedback</h2>
      {sent ? <p role="status">Thanks—your feedback was saved.</p> : <form onSubmit={send}>
        <label htmlFor="site-feedback">What could we make better?</label>
        <textarea id="site-feedback" name="message" value={message} onChange={e => { setMessage(e.target.value); submissionId.current = null; }} maxLength={2000} required rows={5} placeholder="Type your feedback here…" disabled={busy}/>
        <div className="honeypot" aria-hidden="true"><label htmlFor="feedback-website">Website</label><input id="feedback-website" name="website" tabIndex={-1} autoComplete="off"/></div>
        <div className="feedback-actions"><span>{message.length}/2,000</span><button className="button" disabled={busy || !message.trim()}>{busy ? "Sending…" : "Send feedback"}</button></div>
        <p className="feedback-error" role="alert">{error}</p>
      </form>}
    </dialog>
    <dialog ref={privacy} className="footer-dialog privacy-dialog" aria-labelledby="privacy-heading">
      <button className="dialog-close" aria-label="Close privacy note" onClick={() => privacy.current?.close()}>×</button>
      <h2 id="privacy-heading">Privacy</h2>
      <p>We count clicks on the Shrimp Welfare Project donation link to understand interest. These are clicks, not completed donations or unique people. The evaluation link is not included.</p>
      <p>Click records contain the hour in UTC, country when available, browser family, and device category. We do not save IP addresses, full browser strings, names, or email addresses in these records, or link them to signup or feedback entries.</p>
      <p>We do not add tracking cookies, fingerprinting, or persistent visitor IDs. Rapid repeat clicks are suppressed using temporary page memory. We respect Global Privacy Control and Do Not Track signals. Click records older than 90 days are removed when the next click is recorded.</p>
      <p>If you submit your email or feedback, we save what you submit separately. Event RSVPs save your name, event date, and confirmation that you have not already RSVPd on Discord, for food and attendance planning. RSVP names are not displayed publicly.</p>
      <p>Our hosting provider also processes routine request data to operate and secure the site.</p>
    </dialog>
  </div>;
}
