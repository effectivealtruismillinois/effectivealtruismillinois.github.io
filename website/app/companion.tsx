"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Shrimp } from "./shrimp";
import { Salad, type Reaction } from "./shrimp-props";
import { Magnifier } from "./magnifier";
import { trackDonationClick } from "./donation-tracking";

const reactions: Reaction[] = ["impartiality","welfare","scope","rigor","neglected","discord","conversation","mailing","events","resources","open","theory"];
export function Companion({ eye, pupil, typing=false }: { eye: RefObject<SVGPolygonElement | null>; pupil: RefObject<SVGGElement | null>; typing?:boolean }) {
  const stage=useRef<HTMLDivElement>(null), frame=useRef<HTMLDivElement>(null), salad=useRef<HTMLDivElement>(null);
  const [reaction,setReaction]=useState<Reaction>("idle"), [offered,setOffered]=useState(false), [fed,setFed]=useState(false), [disappointed,setDisappointed]=useState(false), [eating,setEating]=useState(false), [mouthOpen,setMouthOpen]=useState(false);
  const offeredRef=useRef(false), fedRef=useRef(false), eatingRef=useRef(false), eatStart=useRef(0), finish=useRef<ReturnType<typeof setTimeout> | null>(null);
  const [thanksOpen,setThanksOpen]=useState(true);
  const [openReady,setOpenReady]=useState(false);
  useEffect(()=>{setOpenReady(false);if(reaction!=="open")return;const timer=setTimeout(()=>setOpenReady(true),1050);return()=>clearTimeout(timer);},[reaction]);
  useEffect(()=>{if(reaction!=="idle")setDisappointed(false);},[reaction]);
  const feed=useCallback(()=>{
    if (fedRef.current || eatingRef.current) return;
    // Reserve the one meal immediately; clicking or dwelling again cannot restart it.
    fedRef.current=true;
    eatingRef.current=true;
    eatStart.current=performance.now();
    setEating(true); setMouthOpen(false);
    finish.current=setTimeout(()=>{setFed(true);setDisappointed(false);eatingRef.current=false;setEating(false);setOffered(false);},2200);
  },[]);
  useEffect(()=>{
    let animation=0, last=performance.now(), dwellAt:number|null=null, focusMode=false;
    let current:{x:number;y:number;w:number}|null=null, pointerPoint:{x:number;y:number}|null=null;
    let touchMode=false, touchRegion:Element|null=null, lastTouchAt=-Infinity;
    let feedingPointer:number|null=null, feedingSurface:Element|null=null, feedingTouch=false;
    const foodPosition=()=>pointerPoint?{x:pointerPoint.x,y:pointerPoint.y-(touchMode?48:0)}:null;
    let foodPoint={x:0,y:0}, mouthPoint={x:0,y:0};
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const updateOffer=(now:number)=>{
      if (!current) return;
      const near=!fedRef.current && !!pointerPoint && pointerPoint.x>current.x+current.w*.18-35 && pointerPoint.x<current.x+current.w*.78+35 && pointerPoint.y>current.y+current.w*.2-35 && pointerPoint.y<current.y+current.w*.78+35;
      if (near!==offeredRef.current) {
        if (!near && offeredRef.current && !fedRef.current) setDisappointed(true);
        if (near) setDisappointed(false);
        offeredRef.current=near; setOffered(near);
      }
      const food=foodPosition();
      const distance=food ? Math.hypot(food.x-mouthPoint.x,food.y-mouthPoint.y) : Infinity;
      const open=near && distance<Math.max(25,current.w*.065);
      setMouthOpen(open);
      if (open && distance<Math.max(touchMode ? 20 : 8,current.w*(touchMode ? .04 : .024)) && !document.hidden) {
        dwellAt ??= now;
        if (now-dwellAt>=2000) { dwellAt=null; feed(); }
      } else dwellAt=null;
    };
    const react=(target:EventTarget|null, retain=false)=>{
      if (!(target instanceof Element)) {if(retain)touchRegion=null;setReaction("idle");return;}
      if(target.closest(".shrimp-mouth-target,.shrimp-feed-zone"))return;
      let region=target.closest(".discord-card,.conversation-card,.mailing,.upcoming-events,.resources") ?? target.closest("[data-shrimp],a,button,input,label,[role=switch],[role=checkbox]");
      const kind=region?.getAttribute("data-shrimp");
      // A tooltip can disappear after a touch; remember its underlying idea instead.
      if(retain && region?.matches(".idea-tooltip")) region=document.querySelector(`.principle[data-shrimp="${kind}"]`) ?? region;
      if(retain) touchRegion=region;
      setReaction(region?.matches(".discord-card")?"discord":reactions.includes(kind as Reaction) ? kind as Reaction : region ? "attentive" : "idle");
    };
    const checkTouchRegion=()=>{
      if(!touchMode || !touchRegion)return;
      const b=touchRegion.getBoundingClientRect(), view=window.visualViewport;
      const left=view?.offsetLeft ?? 0, top=view?.offsetTop ?? 0;
      if(!touchRegion.isConnected || b.bottom<=top || b.top>=top+(view?.height ?? innerHeight) || b.right<=left || b.left>=left+(view?.width ?? innerWidth)){
        touchRegion=null;setReaction("idle");
      }
    };
    const tick=(now:number)=>{
      if (stage.current && frame.current) {
        const b=stage.current.getBoundingClientRect(), p=Math.max(0,Math.min(1,(18-(b.top+b.width*.25))/150)), dockWidth=innerWidth<760?132:174;
        const target={x:b.left*(1-p)+(document.documentElement.clientWidth-dockWidth-12)*p,y:b.top*(1-p)+10*p,w:b.width*(1-p)+dockWidth*p};
        current ??= target;
        const blend=reduced.matches?1:1-Math.exp(-Math.min(50,now-last)/190);
        current=p===0?target:{x:current.x+(target.x-current.x)*blend,y:current.y+(target.y-current.y)*blend,w:current.w+(target.w-current.w)*blend};
        // Finish the interpolation rather than repainting ever smaller fractional changes.
        for (const key of ["x","y","w"] as const) if(Math.abs(current[key]-target[key])<.03) current[key]=target[key];
        frame.current.style.transform=`translate3d(${current.x.toFixed(3)}px,${current.y.toFixed(3)}px,0)`;
        frame.current.style.width=`${current.w.toFixed(3)}px`;
        frame.current.style.visibility="visible"; frame.current.dataset.docked=String(p>.95);
        const svg=frame.current.querySelector("svg"), matrix=svg?.getScreenCTM();
        if (matrix) {
          const point=new DOMPoint(191,218).matrixTransform(matrix);
          mouthPoint={x:point.x,y:point.y};
        }
        updateOffer(now);
        if (salad.current) {
          salad.current.style.visibility="visible";
          salad.current.style.width=`${current.w*.14}px`;
          salad.current.style.height=`${current.w*.14*80/90}px`;
          if (eatingRef.current) {
            if (!foodPoint.x && !foodPoint.y) foodPoint={...mouthPoint};
            const t=Math.min(1,(now-eatStart.current)/650);
            foodPoint={x:foodPoint.x+(mouthPoint.x-foodPoint.x)*.22,y:foodPoint.y+(mouthPoint.y-foodPoint.y)*.22};
            salad.current.style.transform=`translate3d(${foodPoint.x}px,${foodPoint.y}px,0) translate(-50%,-50%) scale(${Math.max(.0001,1-t)})`;
            salad.current.style.opacity=String(1-t);
          } else if (pointerPoint) {
            foodPoint=foodPosition()!;
            salad.current.style.transform=`translate3d(${foodPoint.x}px,${foodPoint.y}px,0) translate(-50%,-50%)`;
            salad.current.style.opacity="1";
          }
        }
      }
      last=now; animation=requestAnimationFrame(tick);
    };
    const touchAt=(x:number,y:number)=>{
      touchMode=true;focusMode=false;lastTouchAt=performance.now();
      if(frame.current)frame.current.dataset.inputTouch="true";
      pointerPoint={x,y};
      // Touch pointers are implicitly captured by their first target. Hit-test the
      // actual contact position, including during a native scrolling gesture.
      react(document.elementFromPoint(x,y),true);updateOffer(lastTouchAt);
    };
    const pointer=(e:PointerEvent)=>{
      if(e.pointerType==="touch"){
        const surface=e.target instanceof Element?e.target.closest(".shrimp-feed-zone,.shrimp-mouth-target"):null;
        if(e.type==="pointerdown" && surface && !fedRef.current){
          feedingPointer=e.pointerId;feedingSurface=surface;feedingTouch=true;
          try{surface.setPointerCapture(e.pointerId);}catch{}
          if(surface.matches(".shrimp-mouth-target") || (current&&Math.hypot(e.clientX-mouthPoint.x,e.clientY-mouthPoint.y)<Math.max(22,current.w*.035)))feed();
        }
        if(feedingPointer!==null&&feedingPointer!==e.pointerId)return;
        touchAt(e.clientX,e.clientY);return;
      }
      touchMode=false;touchRegion=null;focusMode=false;
      if(frame.current)frame.current.dataset.inputTouch="false";
      react(e.target);pointerPoint={x:e.clientX,y:e.clientY};updateOffer(performance.now());
    };
    const touch=(e:TouchEvent)=>{
      if(e.type==="touchstart" && e.target instanceof Element && e.target.closest(".shrimp-feed-zone,.shrimp-mouth-target") && !fedRef.current){
        feedingTouch=true;
        const contact=e.touches[0];
        if(contact&&current&&Math.hypot(contact.clientX-mouthPoint.x,contact.clientY-mouthPoint.y)<Math.max(22,current.w*.035))feed();
      }
      if(feedingTouch && e.cancelable)e.preventDefault();
      const point=e.touches[0];if(point)touchAt(point.clientX,point.clientY);
    };
    const endTouch=(e?:Event)=>{
      const food=foodPosition();
      if(e?.type!=="pointercancel"&&e?.type!=="touchcancel"&&feedingTouch&&food&&current&&Math.hypot(food.x-mouthPoint.x,food.y-mouthPoint.y)<Math.max(20,current.w*.04))feed();
      if(feedingSurface&&feedingPointer!==null){try{feedingSurface.releasePointerCapture(feedingPointer);}catch{}}
      feedingSurface=null;feedingPointer=null;feedingTouch=false;
      pointerPoint=null;dwellAt=null;updateOffer(performance.now());checkTouchRegion();
    };
    const endPointer=(e:PointerEvent)=>{if(e.pointerType==="touch"&&(feedingPointer===null||feedingPointer===e.pointerId))endTouch(e);};
    const keyboard=()=>{touchMode=false;touchRegion=null;lastTouchAt=-Infinity;};
    const focus=(e:FocusEvent)=>{if(touchMode || performance.now()-lastTouchAt<700)return;focusMode=true;react(e.target);};
    const leave=(e:PointerEvent)=>{if(e.pointerType!=="touch"&&!touchMode&&!e.relatedTarget){pointerPoint=null;updateOffer(performance.now());setReaction("idle");}};
    const scroll=()=>{
      if(touchMode){checkTouchRegion();return;}
      if(pointerPoint&&!focusMode)react(document.elementFromPoint(pointerPoint.x,pointerPoint.y));
    };
    const resize=()=>checkTouchRegion();
    const listeners:[string,EventListener][]=[
      ["pointermove",pointer as EventListener],["pointerdown",pointer as EventListener],["pointerout",leave as EventListener],
      ["pointerup",endPointer as EventListener],["pointercancel",endPointer as EventListener],
      ["touchstart",touch as EventListener],["touchmove",touch as EventListener],["touchend",endTouch],["touchcancel",endTouch],
      ["scroll",scroll],["resize",resize],["focusin",focus as EventListener],["keydown",keyboard],
    ];
    for(const [name,listener] of listeners)window.addEventListener(name,listener,{passive:name!=="touchstart"&&name!=="touchmove"});
    animation=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(animation);for(const [name,listener] of listeners)window.removeEventListener(name,listener);if(finish.current)clearTimeout(finish.current);};
  },[feed]);
  const visibleReaction=eating?"idle":typing?"discord":reaction;
  const mood=visibleReaction==="discord"?"happy":mouthOpen?"open":(visibleReaction==="welfare"||(visibleReaction==="open"&&openReady))?"curious":fed?"happy":disappointed&&!offered?"sad":"neutral";
  return <div ref={stage} className="mascot-stage">
    <div ref={frame} className="shrimp-frame" data-reaction={eating?"eating":typing?"discord":offered?"food":reaction} data-gaze={typing?"mailing":"cursor"} data-mouth={eating?"eating":mood} data-fed={fed}>
      <div className="shrimp-character"><Shrimp eye={eye} pupil={pupil} mood={mood} eating={eating} reaction={visibleReaction} newspaper={typing}/>
        {!fed&&!eating&&<div className="shrimp-feed-zone" aria-hidden="true"/>}
        {!fed&&<button className="shrimp-mouth-target" onClick={feed} disabled={eating} aria-label={eating?"Shrimp is eating":"Feed the shrimp"}/>}
      </div><span className="sr-only" role="status">{eating?"The shrimp is eating.":fed?"The shrimp is happy and fed.":""}</span>
      {fed&&thanksOpen&&<aside className="shrimp-thanks" aria-label="A message from the shrimp"><button className="thanks-dismiss" aria-label="Dismiss shrimp message" onClick={()=>setThanksOpen(false)}>×</button><strong>’presh.</strong><p>Want to help real shrimp, too?</p><a href="https://www.shrimpwelfareproject.org/donate" target="_blank" rel="noreferrer" onClick={trackDonationClick}>Donate to Shrimp Welfare Project ↗</a><a className="shrimp-evaluation" href="https://animalcharityevaluators.org/charity-review/shrimp-welfare-project/" target="_blank" rel="noreferrer">evaluation of SWP</a></aside>}
    </div>
    {(offered||eating)&&<div ref={salad} className="salad-cursor" aria-hidden="true"><div className="salad-pop"><Salad/></div></div>}
    {visibleReaction==="neglected"&&!offered&&<Magnifier frame={frame}/>}
  </div>;
}
