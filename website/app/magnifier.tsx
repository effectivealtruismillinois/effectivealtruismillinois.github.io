"use client";
import { useEffect, useRef, type RefObject } from "react";

export function Magnifier({ frame }: { frame: RefObject<HTMLDivElement | null> }) {
  const lens = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let animation = 0, lastCopy = -Infinity;
    const start = performance.now();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const tick = (now:number) => {
      const svg = frame.current?.querySelector("svg"), matrix = svg?.getScreenCTM();
      const site = frame.current?.closest<HTMLElement>(".site");
      if (matrix && site && lens.current && content.current) {
        const t = (now-start)/1000;
        const point = new DOMPoint(193+(reduced.matches?0:Math.sin(t*1.8)*22),156+(reduced.matches?0:Math.cos(t*1.4)*16)).matrixTransform(matrix);
        const size = Math.max(60,Math.min(118,(frame.current?.clientWidth ?? 200)*.24));
        const radius = size/2;
        const arm = svg?.querySelector<SVGPolygonElement>(".shrimp-arm-left");
        if (arm) {
          const a = arm.points.getItem(4), b = arm.points.getItem(5);
          const grip = new DOMPoint((a.x+b.x)/2,(a.y+b.y)/2).matrixTransform(matrix);
          const dx = grip.x-point.x, dy = grip.y-point.y, distance = Math.hypot(dx,dy)||1;
          const edge = Math.min(radius*.92,distance-3);
          const start = new DOMPoint(point.x+dx/distance*edge,point.y+dy/distance*edge).matrixTransform(matrix.inverse());
          const end = new DOMPoint(grip.x,grip.y).matrixTransform(matrix.inverse());
          svg?.querySelectorAll(".glass-shaft-outer,.glass-shaft-inner").forEach(line=>{line.setAttribute("x1",String(start.x));line.setAttribute("y1",String(start.y));line.setAttribute("x2",String(end.x));line.setAttribute("y2",String(end.y));});
        }
        lens.current.style.width = lens.current.style.height = `${size}px`;
        lens.current.style.transform = `translate3d(${point.x-radius}px,${point.y-radius}px,0)`;
        // A clipped, enlarged copy of the actual DOM includes both the face and background.
        if (now-lastCopy > 120) {
          const copy = site.cloneNode(true) as HTMLElement;
          copy.querySelectorAll(".magnifier-lens,.salad-cursor,.floating-cursor,.shrimp-mouth-target,script").forEach(el=>el.remove());
          // The visual copy must not steal the real form labels or fragment targets.
          copy.removeAttribute("id");
          copy.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
          copy.querySelectorAll("label[for]").forEach(el=>el.removeAttribute("for"));
          copy.style.width = `${site.clientWidth}px`;
          copy.style.overflow = "visible";
          const shrimp = copy.querySelector<HTMLElement>(".shrimp-frame");
          if (shrimp) { shrimp.style.position="absolute"; shrimp.style.top=`${scrollY}px`; copy.appendChild(shrimp); }
          copy.querySelectorAll<HTMLElement>("a,button,input,[tabindex]").forEach(el=>el.tabIndex=-1);
          content.current.replaceChildren(copy);
          lastCopy=now;
        }
        content.current.style.transform = `translate(${radius-5-point.x*1.85}px,${radius-5-(point.y+scrollY)*1.85}px) scale(1.85)`;
      }
      animation=requestAnimationFrame(tick);
    };
    animation=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(animation);
  },[frame]);
  return <div className="magnifier-lens" ref={lens} aria-hidden="true" data-zoom="1.85"><div className="lens-pop"><div className="lens-window"><div ref={content} className="magnifier-content" inert/></div></div></div>;
}
