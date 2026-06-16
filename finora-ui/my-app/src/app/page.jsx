"use client";

import React, { useState, useEffect } from "react";
import TypicalButton from "./components/typicalButton";
import Link from "next/link";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Задержка анимации проявления текста
    const timer = setTimeout(() => {
      setVisible(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // ПРЕДОХРАНИТЕЛЬ: Во время серверного рендеринга (SSR) отдаем пустой контейнер 
  // с фоновым цветом, предотвращая любые несовпадения классов при гидратации.
  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  return (
    // Тег main теперь рендерится как bg-transparent только на клиенте
    <main className="relative min-h-screen w-full bg-transparent overflow-hidden">
      <div 
        className={`absolute inset-0 bg-black/45 z-[1] transition-opacity duration-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`} 
      />

      <div className="absolute inset-0 z-10 p-6 md:p-16 flex flex-col justify-between pointer-events-none select-none">
        
        {/* Блок 1 */}
        <div 
          className={`absolute top-[10%] left-[6%] md:left-[10%] max-w-xl transition-all duration-1000 ease-out transform ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-yellow-500/80 block mb-2">
            [ system_init // 01 ]
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
            HI, I'M <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-white">
              FINORA
            </span>
          </h1>
        </div>

        {/* Блок 2 */}
        <div 
          className={`absolute top-[35%] right-[6%] md:right-[12%] text-right max-w-sm transition-all duration-1000 ease-out delay-200 transform ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-blue-400/80 block mb-2">
            [ core_identity // 02 ]
          </span>
          <p className="text-3xl md:text-5xl font-extralight text-gray-300 leading-tight">
            your financial <br />
            <span className="font-semibold text-white">assistant</span>
          </p>
        </div>

        {/* Блок 3 */}
        <div 
          className={`absolute bottom-[12%] left-[6%] md:left-[10%] max-w-xs md:max-w-md border-l-2 border-yellow-500/40 pl-4 hover:text-white transition-all duration-1000 ease-out delay-500 transform ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 block mb-1">
            // specifications
          </span>
          <p className="text-sm md:text-base text-gray-400 font-light leading-relaxed">
            Smart finance management powered by custom, next-generation AI
            models. Designed to optimize and scale your capital.
          </p>
        </div>
      </div>

      {/* Блок 4 */}
      <div 
        className={`absolute bottom-[10%] right-[6%] md:right-[12%] z-30 transition-all duration-1000 ease-out delay-700 transform ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Link href="/verification" className="pointer-events-auto">
          <TypicalButton>
            Let's get acquainted
          </TypicalButton>
        </Link>
      </div>
    </main>
  );
}