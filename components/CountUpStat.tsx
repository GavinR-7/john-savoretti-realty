"use client"; // uses state, effects, and the browser — must be a client component

import { useEffect, useState, useRef } from "react";

type CountUpStatProps = {
  target: number;       // the final number, e.g. 47
  prefix?: string;      // e.g. "$"
  suffix?: string;      // e.g. "M+"
  duration?: number;    // how long the animation lasts, in ms
};

export default function CountUpStat({
  target,
  prefix = "",
  suffix = "",
  duration = 1500,
}: CountUpStatProps) {
  const [count, setCount] = useState(0);        // the number currently shown
  const [hasStarted, setHasStarted] = useState(false); // so it only runs once
  const ref = useRef<HTMLSpanElement>(null);    // points at this element, to watch it

  // EFFECT 1: watch for the element scrolling into view.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setHasStarted(true);   // flip the switch when it enters the screen
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect(); // cleanup
  }, []);

  // EFFECT 2: once started, run the count-up timer.
  useEffect(() => {
    if (!hasStarted) return; // do nothing until it's in view

    const totalSteps = 60; // how many increments — higher = smoother
    const stepTime = duration / totalSteps; // ms between each tick
    const increment = target / totalSteps;  // amount to add each tick

    let current = 0;
    const id = setInterval(() => {
    current += increment;
    if (current >= target) {
        setCount(target);
        clearInterval(id);
    } else {
        setCount(Math.round(current));
    }
    }, stepTime);

    return () => clearInterval(id);

  }, [hasStarted, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}