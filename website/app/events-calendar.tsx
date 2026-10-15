"use client";
import { useEffect, useState } from "react";
import { MapPin, ArrowUpRight, CalendarPlus } from "lucide-react";
import type { CalendarEvent } from "./calendar-events";
import { eventCalendarLink, eventTimeRange, descriptionParts, isRsvpDescriptionPart } from "./calendar-links";
import { EventRsvpDialog } from "./event-rsvp";
type CalendarData={calendarId?:string|null;events?:CalendarEvent[];error?:string};
export function EventsCalendar() {
 const [data,setData]=useState<CalendarData|null>(null);
 const [rsvpEvent,setRsvpEvent]=useState<CalendarEvent|null>(null);
 useEffect(()=>{const controller=new AbortController();fetch("/api/calendar",{signal:controller.signal}).then(r=>r.json() as Promise<CalendarData>).then(setData).catch(e=>{if(e.name!=="AbortError")setData({error:"Events couldn’t load right now."});});return()=>controller.abort();},[]);
 const calendarUrl=data?.calendarId?`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(data.calendarId)}`:null;
 const format=(date:string,options:Intl.DateTimeFormatOptions,allDay=false)=>new Intl.DateTimeFormat("en-US",{timeZone:allDay?"UTC":"America/Chicago",...options}).format(new Date(allDay?`${date}T12:00:00Z`:date));
 return <div className="event-agenda" aria-live="polite">
 {!data?<p className="events-pending">Loading events…</p>:data.error?<p className="events-pending">{data.error}</p>:!data.events?.length?<div className="agenda-empty"><span className="agenda-mark" aria-hidden="true">↗</span><div><h4>The next gathering is on its way.</h4><p>Dates will appear here as soon as they’re announced.</p></div></div>:<ul className="event-list">{data.events.map(event=>{const parts=descriptionParts(event.description);return <li key={event.id} className="event-item"><time className="event-date" dateTime={event.start}><span>{format(event.start,{month:"short"},event.allDay)}</span><strong>{format(event.start,{day:"numeric"},event.allDay)}</strong></time><div className="event-copy"><p className="event-time">{format(event.start,{weekday:"long"},event.allDay)} · {eventTimeRange(event)}</p><h4>{event.title}</h4>{event.location&&<div className="event-location"><MapPin size={16} aria-hidden="true"/><span>{event.location}</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer">Google Maps <ArrowUpRight size={14}/></a></div>}{event.description&&<p className="event-description">{parts.map((part,i)=>isRsvpDescriptionPart(part,parts[i-1]?.text)?<button type="button" className="inline-rsvp" key={i} aria-label={`RSVP for ${event.title} on ${format(event.start,{month:"long",day:"numeric"},event.allDay)}`} onClick={()=>setRsvpEvent(event)}>{part.text}</button>:part.url?<a key={i} href={part.url} target="_blank" rel="noreferrer">{part.text}</a>:part.text)}</p>}</div><a className="event-open" href={eventCalendarLink(event)} target="_blank" rel="noreferrer" aria-label={`Add ${event.title} to your calendar`}><CalendarPlus size={18} aria-hidden="true"/><span>Add to calendar</span></a></li>;})}</ul>}
 {calendarUrl&&<a className="text-link calendar-link" href={calendarUrl} target="_blank" rel="noreferrer">Follow our Google Calendar <ArrowUpRight size={17}/></a>}
 <EventRsvpDialog event={rsvpEvent} onClose={()=>setRsvpEvent(null)}/>
 </div>;
}
