"use client";

import React from "react";

export default function TypicalButton({ children, className = "", ...props }) {
  return (
    <button
      className={`
        group relative overflow-hidden
        px-8 py-4
        border-b-2 border-white
        text-white font-mono tracking-widest text-xs uppercase
        shadow-[0_0_30px_rgba(255,255,255,0.05)]
        hover:shadow-[0_0_45px_rgba(255,255,255,0.15)]
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 transition-colors duration-500 group-hover:text-black flex items-center justify-center gap-2">
        {children}
      </span>

      <div
        className="
          absolute bottom-0 left-0
          h-full w-full
          bg-white
          origin-bottom
          scale-y-0
          transition-transform duration-500 ease-out
          group-hover:scale-y-100
          z-0
        "
      />
    </button>
  );
}