"use client";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Play } from "lucide-react";
const resources=[
 {title:"An introduction to effective altruism",author:"EffectiveAltruism.org",kind:"Article",description:"The questions, ideas, and practical choices behind trying to help others more effectively.",url:"https://www.effectivealtruism.org/articles/introduction-to-effective-altruism"},
 {title:"Reasons and Persons",author:"Derek Parfit",kind:"Book",description:"A deep dive into identity, rationality, and our responsibilities to people in the future.",url:"https://academic.oup.com/book/12484"},
 {title:"The Goddess of Everything Else",author:"Rational Animations · a story by Scott Alexander",kind:"Video",description:"An animated story about evolution, cooperation, and finding a way beyond our origins.",url:"https://www.youtube.com/watch?v=Bbwp4PbWYzw"},
 {title:"Famine, Affluence, and Morality",author:"Peter Singer",kind:"Essay",description:"What does helping a child in a pond tell us about helping people far away?",url:"https://www.givingwhatwecan.org/get-involved/videos-books-and-essays/famine-affluence-and-morality-peter-singer"},
 {title:"On caring",author:"Nate Soares",kind:"Essay",description:"Why our feelings struggle with large numbers, and how to care beyond that limit.",url:"https://mindingourway.com/on-caring/"},
 {title:"The most important century",author:"Holden Karnofsky",kind:"Series",description:"An argument for taking the possibility of a radically different future seriously.",url:"https://www.cold-takes.com/most-important-century/"},
 {title:"The Precipice",author:"Toby Ord",kind:"Book",description:"Humanity’s future, the risks we face, and what it might take to protect it.",url:"https://theprecipice.com/"},
];
export function ResourceCatalogue(){
 const [viewport,carousel]=useEmblaCarousel({loop:true,align:"center",containScroll:false,duration:35});
 const previous=useRef({selected:0,step:0});
 const [{selected,step},setPosition]=useState(previous.current);
 useEffect(()=>{if(!carousel)return;const sync=()=>{const next=carousel.selectedScrollSnap(),half=Math.floor(resources.length/2);const delta=(next-previous.current.selected+resources.length+half)%resources.length-half;previous.current={selected:next,step:previous.current.step+delta};setPosition(previous.current);};sync();carousel.on("select",sync).on("reInit",sync);return()=>{carousel.off("select",sync).off("reInit",sync);};},[carousel]);
 // The visible sequence alternates continuously, including across an odd-length loop.
 const lowered=(i:number)=>{const half=Math.floor(resources.length/2),offset=(i-selected+resources.length+half)%resources.length-half;return Math.abs((step+offset)%2)===1;};
 const jump=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
 function move(direction:number,button:HTMLButtonElement){
  const reduced=jump();
  if(!reduced){
   for(const animation of button.getAnimations())if(animation.id==="catalogue-press")animation.cancel();
   const animation=button.animate([{transform:getComputedStyle(button).transform,offset:0},{transform:"translateY(-50%) translateY(2px) scale(.97)",offset:.22},{transform:"translateY(-50%) translateY(var(--hover-lift,0px))",offset:1}],{duration:280,easing:"cubic-bezier(.2,.7,.2,1)"});
   animation.id="catalogue-press";
  }
  if(direction<0)carousel?.scrollPrev(reduced);else carousel?.scrollNext(reduced);
 }
 return <div className="resource-catalogue"><div className="catalogue-toolbar"><p>A few places to take the questions further.</p></div><div className="catalogue-stage"><div ref={viewport} className="resource-viewport" role="region" aria-roledescription="carousel" aria-label="Reading and watching catalogue" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();if(e.key==="ArrowLeft")carousel?.scrollPrev(jump());else carousel?.scrollNext(jump());}}}><div className="resource-track">{resources.map((item,i)=><a className={`resource-card resource-card-${i%3}${lowered(i)?" is-lowered":""}${selected===i?" is-selected":""}`} key={item.url} href={item.url} target="_blank" rel="noreferrer" aria-current={selected===i?"true":undefined}><div className="resource-art" aria-hidden="true">{item.kind==="Video"?<Play size={43}/>:<BookOpen size={43}/>}</div><span className="resource-kind">{item.kind}</span><h3>{item.title}</h3><p className="resource-author">{item.author}</p><p className="resource-description">{item.description}</p><span className="resource-go">{item.kind==="Video"?"Watch":"Explore"} <ArrowUpRight size={18}/></span></a>)}</div></div><button className="catalogue-edge catalogue-prev" aria-label="Previous resource" onClick={e=>move(-1,e.currentTarget)}><ArrowLeft size={24}/></button><button className="catalogue-edge catalogue-next" aria-label="Next resource" onClick={e=>move(1,e.currentTarget)}><ArrowRight size={24}/></button></div><div className="catalogue-dots" role="group" aria-label="Choose a resource">{resources.map((item,i)=><button key={item.url} aria-label={`Show ${item.title}`} aria-pressed={selected===i} onClick={()=>carousel?.scrollTo(i,jump())}><span/></button>)}</div></div>;
}
