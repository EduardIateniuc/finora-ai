"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [fadeStage, setFadeStage] = useState("fade-in");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const publicRoutes = ["/", "/verification"];
    const isPublicRoute = 
      publicRoutes.includes(pathname) || 
      pathname.startsWith("/info") || 
      pathname.startsWith("/registration-init");

    // Защита страниц: если токена нет, принудительно кидаем на логин
    if (!isPublicRoute) {
      const token = localStorage.getItem("finora_auth_token");
      if (!token) {
        router.replace("/verification");
        return;
      }
    }

    setFadeStage("fade-out");
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setFadeStage("fade-in");
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, children, router, isClient]);

  return (
    <div
      // relative z-10 поднимает весь контент поверх кольца, не перекрывая клики
      className={`relative z-10 min-h-screen w-full transition-opacity duration-300 ease-in-out ${
        fadeStage === "fade-in" ? "opacity-100" : "opacity-0"
      }`}
    >
      {displayChildren}
    </div>
  );
}