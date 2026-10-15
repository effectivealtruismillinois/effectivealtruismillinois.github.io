import { saveSubscriber } from "../../../db/subscribers";
export async function POST(request: Request) {
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin) return Response.json({error:"Please submit from this website."},{status:403});
 try {
  const raw=await request.text();
  if(raw.length>1024) return Response.json({error:"Please enter a valid email address."},{status:400});
  let data;try{data=JSON.parse(raw)}catch{return Response.json({error:"Please enter a valid email address."},{status:400})}
  if(!data||typeof data!=="object")return Response.json({error:"Please enter a valid email address."},{status:400});
  if(data.website) return Response.json({ok:true});
  const email=typeof data.email==="string"?data.email.trim().toLowerCase():"";
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({error:"Please enter a valid email address."},{status:400});
  await saveSubscriber(email);
  return Response.json({ok:true},{status:201,headers:{"Cache-Control":"no-store"}});
 } catch(error){console.error("Subscription save failed",error instanceof Error?error.message:"Unknown error");return Response.json({error:"We couldn’t save your email. Please try again in a moment."},{status:503})}
}
