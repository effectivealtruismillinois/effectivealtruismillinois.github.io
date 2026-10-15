import { publicCalendar, configuredCalendarId } from "../../../lib/public-calendar";
export async function GET() {
  try{
    return Response.json(await publicCalendar(),{headers:{"Cache-Control":"public, max-age=60"}});
  }catch{return Response.json({calendarId:configuredCalendarId(),events:[],error:"Events couldn’t load right now. You can still see them in Google Calendar."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
