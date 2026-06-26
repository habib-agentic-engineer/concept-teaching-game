"use client";

import React, { useState, useEffect } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 20, onComplete }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let index = 0;
    
    // Safety guard
    if (!text) return;

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      
      if (index >= text.length) {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => {
      clearInterval(interval);
    };
  }, [text, speed, onComplete]);

  return <span>{displayedText}</span>;
}
