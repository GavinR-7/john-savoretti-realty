"use client";

/*
  Subtle scroll-reveal wrapper. Wrap any block in <Reveal> and it fades/rises
  into view the first time it scrolls onto screen.

  How: an IntersectionObserver (a browser API that tells you when an element
  enters the viewport) adds the .is-visible class once, then disconnects.
  The actual animation is pure CSS (see .reveal in globals.css), which also
  lets us turn it off for prefers-reduced-motion users with one media query.

  "use client" because this needs browser APIs + a ref — it can't run on the
  server. Keeping the client boundary in tiny leaf components like this lets
  the big page sections stay server-rendered.
*/

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number; // ms — stagger siblings by passing 100, 200, ...
};

export default function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect(); // animate once, then stop watching
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
