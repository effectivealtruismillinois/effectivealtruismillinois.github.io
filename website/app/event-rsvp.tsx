"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CalendarEvent } from "./calendar-events";
import { Checkbox } from "@/components/ui/checkbox";
import { eventDateKey, eventTimeRange } from "./calendar-links";
export function EventRsvpDialog({event, onClose}: {event:CalendarEvent|null;onClose:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null), submissionId = useRef<string|null>(null), generation = useRef(0);
  const [name,setName] = useState(""), [confirmed,setConfirmed] = useState(false), [busy,setBusy] = useState(false), [saved,setSaved] = useState(false), [error,setError] = useState("");
  useEffect(() => {
    generation.current += 1; setBusy(false);
    if (!event) return;
    setName(""); setConfirmed(false); setSaved(false); setError(""); submissionId.current = null;
    dialog.current?.showModal();
  }, [event]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!event || busy || saved || !confirmed) return;
    const form = e.currentTarget;
    const currentGeneration = generation.current;
    setBusy(true); setError("");
    try {
      submissionId.current ??= crypto.randomUUID();
      const response = await fetch("/api/rsvp", {method:"POST",headers:{"Content-Type":"application/json"},credentials:"omit",body:JSON.stringify({id:submissionId.current,eventDate:eventDateKey(event),eventStart:event.start,name,notOnDiscord:confirmed,website:(form.elements.namedItem("website") as HTMLInputElement).value})});
      const result = await response.json() as {error?:string};
      if (!response.ok) throw new Error(result.error ?? "We couldn’t save your RSVP. Please try again.");
      if (generation.current === currentGeneration) setSaved(true);
    } catch (err) { if (generation.current === currentGeneration) setError(err instanceof Error ? err.message : "We couldn’t save your RSVP. Please try again."); }
    finally { if (generation.current === currentGeneration) setBusy(false); }
  }
  const date = event ? new Intl.DateTimeFormat("en-US", {timeZone:event.allDay?"UTC":"America/Chicago",weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(new Date(event.allDay?`${event.start}T12:00:00Z`:event.start)) : "";
  return <dialog ref={dialog} className="footer-dialog rsvp-dialog" aria-labelledby="rsvp-heading" onClose={onClose}>
    <button type="button" className="dialog-close" aria-label="Close RSVP" onClick={()=>dialog.current?.close()}>×</button>
    <h2 id="rsvp-heading">RSVP</h2>
    <p className="rsvp-event-title">{event?.title}</p><p className="rsvp-event-date">{date}{event?` · ${eventTimeRange(event)}`:""}</p>
    {saved ? <p className="rsvp-success" role="status">You’re on the list for {date}. See you there!</p> : <form onSubmit={submit}>
      <label htmlFor="rsvp-name">Your name</label><input id="rsvp-name" name="name" value={name} onChange={e=>{setName(e.target.value);submissionId.current=null;}} maxLength={100} required autoComplete="name" placeholder="First and last name" disabled={busy}/>
      <div className="honeypot" aria-hidden="true"><label htmlFor="rsvp-website">Website</label><input id="rsvp-website" name="website" tabIndex={-1} autoComplete="off"/></div>
      <label className="consent rsvp-confirmation"><Checkbox checked={confirmed} onCheckedChange={v=>setConfirmed(v===true)} disabled={busy} required/><span>I haven’t already RSVPd on Discord.</span></label>
      <p className="rsvp-purpose">Your name helps us plan food and attendance for this event.</p>
      <button className="button" disabled={busy||!confirmed||!name.trim()}>{busy?"Saving…":"RSVP"}</button>
      {error&&<p className="feedback-error" role="alert">{error}</p>}
    </form>}
  </dialog>;
}
