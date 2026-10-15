"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
const IDLE_MS = 5_000;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const random = (a: number, b: number) => a + Math.random() * (b - a);

export function useExploration() {
  const [active, setActive] = useState(-1);
  const [automatic, setAutomatic] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const eye = useRef<SVGPolygonElement>(null);
  const pupil = useRef<SVGGElement>(null);
  const realPointer = useRef<Point>({ x: 0, y: 0 });
  const resumeAt = useRef(0);
  const isAuto = useRef(false);
  const hovered = useRef(-1);
  const pinned = useRef(-1);
  const pressed = useRef(-1);
  const manualTarget = useRef(-1);

  const show = useCallback((i: number) => {
    if (hovered.current === i) return;
    hovered.current = i;
    setActive(i);
  }, []);

  const manual = useCallback((i: number, persist=false) => {
    if(!persist && pinned.current>=0 && (i===-1 || i===pinned.current))return;
    pinned.current=persist?i:-1;
    manualTarget.current=i;
    resumeAt.current = manualTarget.current>=0?Infinity:performance.now() + IDLE_MS;
    isAuto.current = false;
    setAutomatic(false);
    if (cursor.current) cursor.current.style.opacity = "0";
    show(i);
  }, [show]);
  const prepareClick=useCallback(()=>{pressed.current=pinned.current;},[]);
  const toggle=useCallback((i:number)=>{manual(pressed.current===i?-1:i,true);pressed.current=-1;},[manual]);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    realPointer.current = { x: innerWidth / 2, y: innerHeight / 2 };
    resumeAt.current = performance.now() + 500;
    let animation = 0;
    let position: Point | null = null;
    let path: { from: Point; to: Point; c1: Point; c2: Point; start: number; duration: number; rest: number } | null = null;
    let bag: number[] = [];
    let previous = -1;
    let mousePresent=false;

    const activity = (event: Event) => {
      if (event instanceof PointerEvent) {
        realPointer.current = { x: event.clientX, y: event.clientY };
        mousePresent=event.pointerType!=="touch";
      } else if (event instanceof TouchEvent && event.touches[0]) {
        mousePresent=false;
        realPointer.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      if((event instanceof PointerEvent && event.pointerType==="touch") || (typeof TouchEvent!=="undefined" && event instanceof TouchEvent && event.touches[0])) {
        const target=document.elementFromPoint(realPointer.current.x,realPointer.current.y)?.closest(".idea-wrap");
        manual(target?Number(target.getAttribute("data-idea-index")):-1,true);
      }else if(event.type==="click" || event.type==="focusin") {
        if(!(event.target instanceof Element) || !event.target.closest(".idea-wrap")){pinned.current=-1;manualTarget.current=-1;show(-1);}
      }
      if(manualTarget.current>=0){
        const bounds=cards.current[manualTarget.current]?.getBoundingClientRect();
        if(!bounds || bounds.bottom<=0 || bounds.top>=innerHeight){pinned.current=-1;manualTarget.current=-1;show(-1);}
      }
      resumeAt.current = manualTarget.current>=0?Infinity:performance.now() + IDLE_MS;
      path = null;
      position = null;
      if (isAuto.current) {
        isAuto.current = false;
        setAutomatic(false);
        show(-1);
      }
      if (cursor.current) cursor.current.style.opacity = "0";
    };

    const nextCard = () => {
      if (!bag.length) {
        bag = cards.current.map((_, i) => i).filter(i => cards.current[i]);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        if (bag[bag.length - 1] === previous && bag.length > 1) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      }
      previous = bag.pop() ?? 0;
      return cards.current[previous];
    };

    let shineX = 0, shineY = 0, eyeTime = performance.now();
    const moveEye = (target: Point) => {
      if (!eye.current || !pupil.current) return;
      const matrix = eye.current.getScreenCTM();
      if (!matrix) return;
      const local = new DOMPoint(target.x,target.y).matrixTransform(matrix.inverse());
      const center = new DOMPoint(192,158.5).matrixTransform(matrix);
      const lookingAway = eye.current.closest(".shrimp-frame")?.getAttribute("data-reaction")==="impartiality";
      const angle = Math.atan2(local.y-158.5,local.x-192);
      const amount = Math.min(10,Math.hypot(target.x-center.x,target.y-center.y)/30);
      const wantedX = lookingAway?(local.x<192?13:-13):Math.cos(angle)*amount, wantedY = lookingAway?-13:Math.sin(angle)*amount;
      const now = performance.now(), blend = 1-Math.exp(-Math.min(50,now-eyeTime)/110);
      eyeTime = now;
      if (Math.hypot(wantedX-shineX,wantedY-shineY)<.09) return;
      shineX += (wantedX-shineX)*blend;
      shineY += (wantedY-shineY)*blend;
      pupil.current.setAttribute("transform",`translate(${shineX.toFixed(2)} ${shineY.toFixed(2)})`);
    };

    const frame = (now: number) => {
      const mouseBox=mousePresent?document.elementFromPoint(realPointer.current.x,realPointer.current.y)?.closest(".idea-wrap"):null;
      if (now >= resumeAt.current && !mouseBox && !reduced.matches && !document.hidden && cursor.current && root.current) {
        if (!isAuto.current) { isAuto.current = true; setAutomatic(true); }
        if (!path || now > path.start + path.duration + path.rest) {
          const card = nextCard();
          if (card) {
            const bounds = card.getBoundingClientRect();
            const to = { x: bounds.left + bounds.width * random(.3, .7) + scrollX, y: bounds.top + bounds.height * random(.4, .75) + scrollY };
            position ??= { x: to.x - 55, y: to.y + 45 };
            const from = { ...position };
            const distance = Math.hypot(to.x - from.x, to.y - from.y);
            const bend = Math.min(150, distance * .3);
            const maxX = document.documentElement.clientWidth - 35;
            const maxY = document.documentElement.scrollHeight - 35;
            const control = (t: number): Point => ({ x: Math.max(20, Math.min(maxX, mix(from.x, to.x, t) + random(-bend, bend))), y: Math.max(20, Math.min(maxY, mix(from.y, to.y, t) + random(-bend, bend))) });
            path = { from, to, c1: control(.32), c2: control(.68), start: now, duration: Math.min(3600, 1200 + distance * 1.4), rest: random(2400, 3900) };
          }
        }
        if (path) {
          const t = Math.min(1, (now - path.start) / path.duration);
          const u = t * t * (3 - 2 * t);
          const v = 1 - u;
          position = { x: v ** 3 * path.from.x + 3 * v ** 2 * u * path.c1.x + 3 * v * u ** 2 * path.c2.x + u ** 3 * path.to.x, y: v ** 3 * path.from.y + 3 * v ** 2 * u * path.c1.y + 3 * v * u ** 2 * path.c2.y + u ** 3 * path.to.y };
          const rootBounds = root.current.getBoundingClientRect();
          cursor.current.style.transform = `translate3d(${position.x - rootBounds.left - scrollX}px,${position.y - rootBounds.top - scrollY}px,0)`;
          cursor.current.style.opacity = "1";
          const target = { x: position.x - scrollX, y: position.y - scrollY };
          show(cards.current.findIndex(card => { if (!card) return false; const r = card.getBoundingClientRect(); return target.x >= r.left && target.x <= r.right && target.y >= r.top && target.y <= r.bottom; }));

        }
      } else {

        if (cursor.current) cursor.current.style.opacity = "0";
        if (isAuto.current) { isAuto.current = false; setAutomatic(false); show(-1); }
      }
      const typing=eye.current?.closest(".shrimp-frame")?.getAttribute("data-gaze")==="mailing";
      const input=typing?document.querySelector<HTMLInputElement>("#email"):null;
      const bounds=input?.getBoundingClientRect();
      moveEye(bounds?{x:bounds.left+bounds.width/2,y:bounds.top+bounds.height/2}:realPointer.current);
      animation = requestAnimationFrame(frame);
    };
    const events = ["pointermove", "pointerdown", "click", "focusin", "keydown", "wheel", "scroll", "touchstart", "touchmove", "resize"];
    for (const name of events) window.addEventListener(name, activity, { passive: true });
    animation = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animation); for (const name of events) window.removeEventListener(name, activity); };
  }, [show,manual]);

  return { active, automatic, manual, prepareClick, toggle, root, cursor, cards, eye, pupil };
}
