"use client";
import { useEffect, useRef } from "react";
import type { Reaction } from "./shrimp-props";

type Shape = number[][];
type Pose = {angle:number;length:number;flex:number;shiftX:number;shiftY:number};
const left: Shape = [[282,232],[258,265],[247,295],[256,302],[270,277],[297,249]];
const right: Shape = [[333,254],[305,277],[282,298],[287,308],[311,290],[349,275]];
const rest = ():Pose => ({angle:0,length:1,flex:0,shiftX:0,shiftY:0});
function poses(reaction:Reaction,t=0):[Pose,Pose] {
  const a=rest(),b=rest();
  if(reaction==="discord") {
    const clap=(1-Math.cos(t*Math.PI*2/.28))/2;
    a.angle=-33*clap;b.angle=-153+33*clap;
    b.shiftX=36;b.shiftY=-18;
  } else if(reaction==="theory") {
    a.angle=60;b.angle=-145;
    a.flex=b.flex=1;a.length=b.length=1.2;
    b.shiftX=36;b.shiftY=-9;
  } else if(reaction==="rigor") {a.angle=44+Math.sin(t*8)*4;a.length=.88;}
  else if(reaction==="conversation"||reaction==="events"||reaction==="mailing") a.angle=17;
  else if(reaction==="resources") b.angle=20;
  return [a,b];
}

// Every ordinary gesture rigidly rotates the original outline. Only flexing
// adds a bicep/forearm silhouette and moves the right shoulder around the body.
function move(base:Shape,pose:Pose):Shape {
  const x=(base[0][0]+base[5][0])/2,y=(base[0][1]+base[5][1])/2;
  const tx=(base[2][0]+base[3][0])/2-x,ty=(base[2][1]+base[3][1])/2-y;
  const size=Math.hypot(tx,ty),ux=tx/size,uy=ty/size;
  const angle=pose.angle*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const sample=(side:0|1,t:number)=>{
    const start=base[side===0?0:5],joint=base[side===0?1:4],tip=base[side===0?2:3];
    const first=Math.hypot(joint[0]-start[0],joint[1]-start[1]),second=Math.hypot(tip[0]-joint[0],tip[1]-joint[1]);
    const distance=t*(first+second),a=distance<first?start:joint,b=distance<first?joint:tip;
    const f=distance<first?distance/first:(distance-first)/second;
    return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
  };
  const stations=(side:0|1)=>{
    const start=base[side===0?0:5],joint=base[side===0?1:4],tip=base[side===0?2:3];
    const a=Math.hypot(joint[0]-start[0],joint[1]-start[1]),b=Math.hypot(tip[0]-joint[0],tip[1]-joint[1]);
    return [0,.30,a/(a+b),.78,1];
  };
  const widths=[12,20,9,11,7];
  const outline=[...stations(0).map((t,i)=>({side:0 as const,t,i})),...stations(1).toReversed().map((t,j)=>({side:1 as const,t,i:4-j}))];
  return outline.map(({side,t,i})=>{
    const normal=sample(side,t),width=widths[i]*(side===0?1:-1);
    const joint=.56,bend=(base===left?1:-1)*Math.PI/2*pose.flex;
    const fx=ux*Math.cos(bend)-uy*Math.sin(bend),fy=ux*Math.sin(bend)+uy*Math.cos(bend);
    const muscleT=i===2?joint:t;
    const first=Math.min(muscleT,joint)*size,second=Math.max(0,muscleT-joint)*size;
    const centerX=x+ux*first+fx*second,centerY=y+uy*first+fy*second;
    const turn=i===2?bend/2:t>joint?bend:0;
    const nx=-(ux*Math.sin(turn)+uy*Math.cos(turn)),ny=ux*Math.cos(turn)-uy*Math.sin(turn);
    const edge=i===2?width/Math.cos(bend/2):width;
    const muscle=t===0?normal:[centerX+nx*edge,centerY+ny*edge];
    const px=normal[0]+(muscle[0]-normal[0])*pose.flex,py=normal[1]+(muscle[1]-normal[1])*pose.flex;
    const along=((px-x)*ux+(py-y)*uy)*pose.length;
    const across=(-(px-x)*uy+(py-y)*ux);
    const dx=along*ux-across*uy,dy=along*uy+across*ux;
    return [x+pose.shiftX+dx*c-dy*s,y+pose.shiftY+dx*s+dy*c];
  });
}
export function armPose(reaction:Reaction,t=0):[Shape,Shape] {const p=poses(reaction,t);return [move(left,p[0]),move(right,p[1])];}
export function armGrip(reaction:Reaction,side:0|1) {const p=armPose(reaction)[side];return [(p[4][0]+p[5][0])/2,(p[4][1]+p[5][1])/2];}

export function ShrimpArms({reaction}:{reaction:Reaction}) {
  const l=useRef<SVGPolygonElement>(null),r=useRef<SVGPolygonElement>(null),kind=useRef(reaction),started=useRef(0);
  useEffect(()=>{kind.current=reaction;started.current=performance.now();},[reaction]);
  useEffect(()=>{
    let animation=0,last=performance.now();
    let current=[rest(),rest()];
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const tick=(now:number)=>{
      const target=poses(kind.current,reduced.matches?0:(now-started.current)/1000);
      const blend=reduced.matches?1:1-Math.exp(-Math.min(50,now-last)/(kind.current==="discord"?18:110));
      current=current.map((p,i)=>({angle:p.angle+(target[i].angle-p.angle)*blend,length:p.length+(target[i].length-p.length)*blend,flex:p.flex+(target[i].flex-p.flex)*blend,shiftX:p.shiftX+(target[i].shiftX-p.shiftX)*blend,shiftY:p.shiftY+(target[i].shiftY-p.shiftY)*blend}));
      [l.current,r.current].forEach((el,i)=>{
        if(!el)return;
        const shape=move(i===0?left:right,current[i]);
        el.setAttribute("points",shape.map(p=>p.map(n=>n.toFixed(3)).join(",")).join(" "));
        const grip=[(shape[4][0]+shape[5][0])/2,(shape[4][1]+shape[5][1])/2];
        el.ownerSVGElement?.querySelector(`.held-${i===0?"left":"right"}`)?.setAttribute("transform",`translate(${grip[0]} ${grip[1]})`);
      });
      last=now;animation=requestAnimationFrame(tick);
    };
    animation=requestAnimationFrame(tick);return()=>cancelAnimationFrame(animation);
  },[]);
  return <g className="shrimp-arms" fill="#ff7966" stroke="#181818" strokeWidth="6" strokeLinejoin="round"><polygon ref={l} className="shrimp-arm shrimp-arm-left" points={move(left,rest()).map(p=>p.join(",")).join(" ")}/><polygon ref={r} className="shrimp-arm shrimp-arm-right" points={move(right,rest()).map(p=>p.join(",")).join(" ")}/></g>;
}
