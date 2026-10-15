import { saveDonationClick } from "../../../db/donation-clicks";
import { donationMetadata, skipDonationAnalytics } from "../../../lib/donation-analytics";
export async function POST(request:Request) {
  if(request.headers.get("origin")!==new URL(request.url).origin)return new Response(null,{status:403});
  if(skipDonationAnalytics(request))return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
  try {
    const body=await request.text();
    if(body.length>128)return new Response(null,{status:400});
    let data;try{data=JSON.parse(body);}catch{return new Response(null,{status:400});}
    if(typeof data?.id!=="string"||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id))return new Response(null,{status:400});
    await saveDonationClick(data.id, donationMetadata(request));
    return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("Donation click save failed",error instanceof Error?error.message:"Unknown error");return new Response(null,{status:503});}
}
