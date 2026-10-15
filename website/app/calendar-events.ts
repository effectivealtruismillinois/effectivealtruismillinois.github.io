import ICAL from "ical.js";
export type CalendarEvent = {id:string;title:string;start:string;end:string;allDay:boolean;location:string;description:string};
export function upcomingEvents(source:string,now=Date.now()):CalendarEvent[]{
 const calendar=new ICAL.Component(ICAL.parse(source));
 for(const zone of calendar.getAllSubcomponents("vtimezone"))ICAL.TimezoneService.register(zone);
 const components=calendar.getAllSubcomponents("vevent"),endWindow=now+366*86400000,results:CalendarEvent[]=[];
 const add=(event:ICAL.Event,start:ICAL.Time,end:ICAL.Time,key:string)=>{
  if(event.component.getFirstPropertyValue("status")==="CANCELLED")return;
  // Google sends this placeholder when public visitors cannot see event details.
  if(event.summary?.trim().toLowerCase()==="busy"&&!event.location&&!event.description)return;
  const startMs=start.toJSDate().getTime(),endMs=end.toJSDate().getTime();
  if(Math.max(startMs,endMs)<now||startMs>endWindow)return;
  results.push({id:key,title:event.summary||"Community event",start:start.isDate?start.toString():start.toJSDate().toISOString(),end:end.isDate?end.toString():end.toJSDate().toISOString(),allDay:start.isDate,location:event.location||"",description:event.description||""});
 };
 for(const component of components){
  const event=new ICAL.Event(component);
  if(event.isRecurrenceException()||!component.hasProperty("dtstart"))continue;
  if(!event.isRecurring()){add(event,event.startDate,event.endDate,event.uid);continue;}
  for(const exception of components.filter(c=>c.hasProperty("recurrence-id")&&c.getFirstPropertyValue("uid")===event.uid))event.relateException(exception);
  const iterator=event.iterator();
  // Bound work for an accidentally unending or high-frequency series.
  for(let i=0;i<20000;i++){
   const occurrence=iterator.next();if(!occurrence||occurrence.toJSDate().getTime()>endWindow)break;
   const detail=event.getOccurrenceDetails(occurrence);
   add(detail.item,detail.startDate,detail.endDate,`${event.uid}/${occurrence.toString()}`);
  }
 }
 return results.sort((a,b)=>a.start.localeCompare(b.start)).slice(0,12);
}
