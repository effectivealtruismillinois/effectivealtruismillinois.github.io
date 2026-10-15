"use client";
import { useEffect, type RefObject } from "react";

export function useSharedSheen(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let animation = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // One horizontal sweep in viewport coordinates, clipped by every surface.
      const t = ((now-start)%4400)/4400;
      const x = -220+(innerWidth+440)*Math.min(1,t/.84);
      if (!reduced.matches && !document.hidden) root.current?.querySelectorAll<HTMLElement>(".shared-sheen").forEach(el => {
        el.style.setProperty("--sweep-local",`${x-el.getBoundingClientRect().left}px`);
      });
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  },[root]);
}
