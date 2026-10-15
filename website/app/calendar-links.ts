import type { CalendarEvent } from "./calendar-events";
const zone = "America/Chicago";
export function eventDateKey(event: Pick<CalendarEvent, "start" | "allDay">) {
 if (event.allDay) return event.start.slice(0, 10);
 const parts = new Intl.DateTimeFormat("en-US", {timeZone:zone, year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(event.start));
 const part = (type: string) => parts.find(p => p.type === type)?.value;
 return `${part("year")}-${part("month")}-${part("day")}`;
}
export function isRsvpDescriptionPart(part: {text:string;url?:string}, previousText="") {
 return Boolean(part.url && (/rsvp/i.test(part.text) || (/^here$/i.test(part.text.trim()) && /rsvp\s*$/i.test(previousText))));
}
export function eventCalendarLink(event: CalendarEvent) {
 const stamp=(value:string)=>value.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
 const params=new URLSearchParams({action:"TEMPLATE",text:event.title,dates:`${stamp(event.start)}/${stamp(event.end)}`,ctz:zone,location:event.location,details:descriptionText(event.description)});
 return `https://calendar.google.com/calendar/render?${params}`;
}
export function eventTimeRange(event: CalendarEvent) {
 if(event.allDay)return "All day";
 const date=(value:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat("en-US",{timeZone:zone,...options}).format(new Date(value));
 const time=(value:string)=>date(value,{hour:"numeric",minute:"2-digit"}).replace(":00", "").toLowerCase().replace(/\s/g, "");
 const sameDay=date(event.start,{year:"numeric",month:"numeric",day:"numeric"})===date(event.end,{year:"numeric",month:"numeric",day:"numeric"});
 const start=time(event.start),end=time(event.end);
 return `${sameDay&&start.slice(-2)===end.slice(-2)?start.slice(0,-2):start}–${sameDay?"":date(event.end,{month:"short",day:"numeric"})+", "}${end} CT`;
}
function decode(text:string){return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{const named:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};if(entity[0]!=="#")return named[entity.toLowerCase()]||"";const code=entity[1].toLowerCase()==="x"?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);return code>0&&code<=0x10ffff?String.fromCodePoint(code):"";});}
export function descriptionText(source:string){
 return decode(source.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").replace(/<a\b[^>]*href\s*=\s*["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,(_,url:string,label:string)=>`[${label.replace(/<[^>]+>/g, "")}](${url})`).replace(/<br\s*\/?\s*>|<\/(?:p|div|li)>/gi, "\n").replace(/<[^>]+>/g, "")).trim();
}
export function descriptionParts(source:string):{text:string;url?:string}[]{
 const text=descriptionText(source),parts:{text:string;url?:string}[]=[];
 const pattern=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>]+)/g;let from=0;
 for(const match of text.matchAll(pattern)){
  parts.push({text:text.slice(from,match.index)});
  let url=match[2]||match[3],suffix="";if(!match[2]){const clean=url.replace(/[.,!?;]+$/, "");suffix=url.slice(clean.length);url=clean;}
  parts.push({text:match[1]||url,url});if(suffix)parts.push({text:suffix});from=match.index!+match[0].length;
 }
 parts.push({text:text.slice(from)});return parts;
}
