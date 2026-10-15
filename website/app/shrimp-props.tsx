import type { ReactNode } from "react";
import { armGrip } from "./shrimp-arms";
export type Reaction = "idle" | "impartiality" | "welfare" | "scope" | "rigor" | "neglected" | "discord" | "conversation" | "mailing" | "events" | "resources" | "open" | "theory" | "attentive";

export function Salad() {
  return <svg viewBox="0 0 90 80" className="tofu-salad" aria-hidden="true"><g stroke="#181818" strokeWidth="3" strokeLinejoin="round"><path d="M10 35h70L69 66 45 73 22 65Z" fill="#f4eee4"/><path d="M12 34 22 22 39 18 60 20 76 29 80 37 61 44 28 43Z" fill="#4c944b"/><path d="m18 32 9-9 8 5-7 11Zm29-6 9-6 9 9-9 9Zm13 11 8-7 9 5-8 8Z" fill="#80bf60" strokeWidth="1.5"/><path d="m28 21 14-3 3 13-15 3Zm23 14 13-3 3 12-14 3Zm-29 0 12-3 3 12-13 2Z" fill="#fff"/><path d="m29 22 13-3m12 17 9-2m-36 3 8-2" stroke="#d5d0c5" strokeWidth="2"/></g></svg>;
}
export function Rainbow({reaction}:{reaction:Reaction}) {
  if(reaction!=="open")return null;
  return <g className="knowledge-rainbow" transform="translate(240 160) rotate(-24)"><g className="rainbow-beam">{["#ff003d","#ff7900","#ffed00","#1bdf23","#00d5ff","#2448ff","#c000ff"].map((color,i)=><path key={color} d={`M0 ${-21+i*7}H150`} stroke={color} strokeWidth="7"/>)}</g><g transform="translate(151 0)"><g className="knowledge-star"><polygon points="0,-35 10,-11 35,-11 15,6 22,31 0,16 -22,31 -15,6 -35,-11 -10,-11" fill="#ffe600" stroke="#181818" strokeWidth="4" strokeLinejoin="round"/></g>{Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45})`}><rect className="star-particle" x="-3" y="-3" width="6" height="6" fill={i%2?"#fff":"#ffe600"}/></g>)}</g></g>;
}
export function TailPopcorn({reaction}:{reaction:Reaction}) {
  if(reaction!=="resources")return null;
  return <g transform="translate(173 293)" stroke="#181818" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"><g className="popcorn-prop prop-pop" style={{transformOrigin:"0px 0px"}}><path d="m-16-25 32-1-5 33-22 1Z" fill="#fff"/><path d="m-10-24 2 30m7-30v30m8-31-3 30" stroke="#bd4938" strokeWidth="4"/><path d="m-17-25-2-8 6-6 7 3 4-7 8 1 3 6 7-3 6 7-2 8Z" fill="#fff4c8"/></g></g>;
}
export function ShrimpProps({reaction,newspaper=false}:{reaction:Reaction;newspaper?:boolean}) {
  const left=armGrip(reaction,0),right=armGrip(reaction,1);
  const held=(side:"left"|"right",content:ReactNode)=>{const p=side==="left"?left:right;return <g className={`held-${side}`} transform={`translate(${p[0]} ${p[1]})`}><g className="prop-pop" style={{transformOrigin:"0px 0px"}}>{content}</g></g>;};
  return <g key={reaction} className={`shrimp-props props-${reaction}`} stroke="#181818" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    {reaction==="impartiality"&&held("left",<g className="scale-prop" transform="scale(.8)"><path d="M0-56v69m-42-49h84m-42-10 8 10-8 9-8-9Z" stroke="#d2ad6a" fill="#d2ad6a"/><path d="m-42-36-17 32m17-32 17 32m67-32-17 32m17-32 17 32" fill="none" stroke="#d2ad6a" strokeWidth="2"/><path d="m-61-4 19 13 19-13Zm84 0L42 9 61-4Z" fill="#eee4cd"/><path d="M-13 14h26" stroke="#d2ad6a" strokeWidth="5"/></g>)}
    {reaction==="scope"&&<g className="prop-pop" style={{transformOrigin:"193px 159px"}}><circle cx="193" cy="159" r="36" fill="#ffffff20" stroke="#d2ad6a" strokeWidth="5"/><path d="m204 130 10 13m8 36 10 29-3 26-13 16" fill="none" stroke="#d2ad6a" strokeWidth="3"/></g>}
    {reaction==="conversation"&&held("left",<g className="coffee-prop"><path d="M-35-26H-4l-3 30-12 5-13-5Z" fill="#fff"/><path d="M-4-19H8V-2H-6" fill="none" stroke="#fff" strokeWidth="5"/><path d="m-35-26 16-4 15 4-15 4Z" fill="#613b29"/><g className="coffee-steam" fill="none" stroke="#d8d8d8" strokeWidth="2"><path d="m-26-36 2-8-2-6m13 14 2-8-2-6"/></g></g>)}
    {(reaction==="mailing"||newspaper)&&held("left",<g className="newspaper-prop" transform="rotate(16) scale(.82)"><path d="M-37-17H25Q35-14 35-1Q35 12 25 15H-37Z" fill="#ababab"/><path d="m-28-9 47 0m-47 7h34m-34 7h44m-20-17v23" stroke="#626262" strokeWidth="2"/><ellipse cx="-37" cy="-1" rx="11" ry="16" fill="#c7c7c7"/><path className="paper-spiral" d="M-35-12C-50-13-49 14-37 13C-25 12-28-7-38-6C-45-5-44 6-38 6C-32 6-33-2-38-1" fill="none" stroke="#5b5b5b" strokeWidth="2"/></g>)}
    {reaction==="events"&&held("left",<g className="pizza-prop"><path d="M-27-24 13-24-7 20Z" fill="#ffe49c"/><path d="M-27-24H13" fill="none" stroke="#b8824c" strokeWidth="8"/><circle cx="-13" cy="-12" r="4" fill="#cb574b"/><circle cx="1" cy="-13" r="4" fill="#cb574b"/><circle cx="-6" cy="2" r="3" fill="#cb574b"/><path d="m-19-4 4 3m13-19-2 3" stroke="#568657" strokeWidth="2"/></g>)}
    {reaction==="resources"&&<>{held("right",<g className="book-prop" transform="rotate(-12)"><path d="M-42-30-25-35-9-27 8-35 25-30 22 5 5 0-12 8-27 1-45 5Z" fill="#80506d"/><path d="m-40-30 15-3 15 8 18-8 14 3" fill="none" stroke="#f3ead9" strokeWidth="3"/><path d="M-9-26-12 7" fill="none" stroke="#d2ad6a" strokeWidth="4"/></g>)}</>}
  </g>;
}
