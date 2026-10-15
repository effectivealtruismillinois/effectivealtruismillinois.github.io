import type { RefObject } from "react";
import { ShrimpArms } from "./shrimp-arms";
import { Rainbow, ShrimpProps, TailPopcorn, type Reaction } from "./shrimp-props";

export function Shrimp({ eye, pupil, mood, eating, reaction, newspaper=false }: { eye: RefObject<SVGPolygonElement | null>; pupil: RefObject<SVGGElement | null>; mood: "happy" | "sad" | "neutral" | "open" | "curious"; eating: boolean; reaction: Reaction; newspaper?:boolean }) {
  return <svg className="polygon-shrimp" viewBox="0 0 520 520" role="img" aria-labelledby="shrimp-title">
    <title id="shrimp-title">A handmade polygon shrimp with one black eye and a white square highlight following the cursor</title>
    <Rainbow reaction={reaction}/>
    <g className="shrimp-antennas" fill="none" strokeLinejoin="round" strokeLinecap="round">
      <g stroke="#181818" strokeWidth="19">
        <polyline points="207,153 199,111 168,78 126,57 78,51 38,58"/>
        <polyline points="236,155 228,100 204,62 165,36 121,24 79,27"/>
      </g>
      <g stroke="#ff7966" strokeWidth="7">
        <polyline points="207,153 199,111 168,78 126,57 78,51 38,58"/>
        <polyline points="236,155 228,100 204,62 165,36 121,24 79,27"/>
      </g>
    </g>
    <g fill="#ff7966" stroke="#181818" strokeWidth="6" strokeLinejoin="round">
      <g className="shrimp-tail"><polygon points="215,302 190,273 150,263 146,291 167,315 209,325"/>
      <polygon points="208,319 168,311 143,294 127,318 150,343 191,353 218,337"/>
      <polygon points="217,335 183,343 151,343 168,375 199,379 224,360"/>
      <TailPopcorn reaction={reaction}/>
      </g><polygon points="247,369 207,357 190,327 215,299 243,321 240,343"/>
      <polygon points="334,366 289,388 247,369 240,343 267,328 303,346"/>
      <polygon points="383,292 372,341 334,366 303,346 309,305 350,321"/>
      <polygon points="354,197 389,249 383,292 350,321 319,291 332,248"/>
      <polygon points="257,153 317,155 354,197 332,248 284,245 250,212"/>
      <polygon points="149,148 192,130 242,146 277,183 283,220 245,260 188,246 153,211 134,179"/>
    </g>
    {reaction === "neglected" && <g className="magnifier-handle prop-pop" style={{transformOrigin:"251.5px 298.5px"}}><line className="glass-shaft-outer" x1="238" y1="219" x2="251.5" y2="298.5" stroke="#181818" strokeWidth="9" strokeLinecap="round"/><line className="glass-shaft-inner" x1="238" y1="219" x2="251.5" y2="298.5" stroke="#b88b57" strokeWidth="5" strokeLinecap="round"/></g>}
    <ShrimpArms reaction={reaction}/>
    {reaction === "theory" && <polygon className="flex-head-overlay" points="149,148 192,130 242,146 277,183 283,220 245,260 188,246 153,211 134,179" fill="#ff7966" stroke="#181818" strokeWidth="6" strokeLinejoin="round"/>}
    <polygon ref={eye} className="shrimp-eye" points="169,139 190,126 212,134 223,155 217,180 194,191 172,181 161,157" fill="#000" stroke="#181818" strokeWidth="6" strokeLinejoin="round"/>
    <g ref={pupil}><rect x="185.25" y="153.375" width="14" height="14" fill="#fff"/></g>
    {eating ? <ellipse className="chewing-mouth" cx="191" cy="218" rx="12" ry="10" fill="#181818"/> : mood === "open" || mood === "curious" ? <ellipse className="curious-mouth" cx="191" cy="218" rx={mood === "open" ? 14 : 10} ry={mood === "open" ? 12 : 10} fill="#181818"/> : <polyline className="shrimp-mouth" points={mood === "happy" ? "177,214 189,222 203,219" : mood === "sad" ? "177,222 189,214 203,219" : "177,218 189,218 203,218"} fill="none" stroke="#181818" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>}
    <ShrimpProps reaction={reaction} newspaper={newspaper}/>
  </svg>;
}
