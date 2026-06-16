"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState("SYNCHRONIZED");

  const CACHE_KEY = "finora_news_cache";
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа

  const fetchNews = async (force = false) => {
    setLoading(true);
    setSyncStatus("CONNECTING");
    try {
      const response = await fetch("/api/gemini/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data && data.news) {
        setNews(data.news);
        setSyncStatus("ONLINE");

        // Сохраняем в кэш
        const cachePayload = {
          timestamp: Date.now(),
          data: data.news,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
      } else {
        setSyncStatus("OFFLINE");
      }
    } catch (error) {
      console.error("Failed to sync news data feed:", error);
      setSyncStatus("ERROR_RECOVERY");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);

    // Проверка источника перехода
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const fromParam = urlParams.get("from");
      const sessionRedirect = sessionStorage.getItem("finora_from_verification");
      const referrer = document.referrer || "";

      // Если зафиксирован переход со страницы верификации
      if (fromParam === "verification" || sessionRedirect === "true" || referrer.includes("/verification")) {
        setShowWelcomeModal(true);
        // Сбрасываем флаг сессии для предотвращения повторного вызова
        sessionStorage.removeItem("finora_from_verification");
      }
    }

    // Проверяем наличие валидного кэша
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const isFresh = Date.now() - parsed.timestamp < CACHE_DURATION;
        if (isFresh && parsed.data && parsed.data.length > 0) {
          setNews(parsed.data);
          setSyncStatus("ONLINE");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse news cache:", e);
      }
    }

    fetchNews(false);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  const getCategoryStyles = (category) => {
    switch (category) {
      case "MARKET_PULSE":
        return { text: "text-yellow-500", border: "border-yellow-500/30", bg: "bg-yellow-500/5" };
      case "STOCK_MARKET":
        return { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/5" };
      case "HEDGE_ASSETS":
        return { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" };
      default:
        return { text: "text-white", border: "border-white/20", bg: "bg-white/5" };
    }
  };

  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0e0f13] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/44 z-[1]" />

      {/* Приветственное модальное окно */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="border border-yellow-500 bg-[#0e0f13] p-8 max-w-md w-full relative font-mono text-xs space-y-6"
            >
              <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
              <div className="border-b border-white/10 pb-3">
                <span className="text-yellow-500 text-[10px] block font-bold">// AUTHENTICATION_SUCCESS // GATEWAY_LINK</span>
                <h3 className="text-sm font-black uppercase mt-1 tracking-tight">Добро пожаловать в Finora</h3>
              </div>

              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Вы успешно авторизовались в системе. На текущую дату (<span className="text-white">{new Date().toLocaleDateString("ru-RU")}</span>) подготовлен свежий аналитический обзор глобальных инвестиционных рынков.
                </p>
                <p>
                  Желаете остаться на этой странице и ознакомиться со сводкой новостей или перейти в панель управления своим профилем?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wider text-center"
                >
                  Остаться здесь
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="py-2.5 bg-yellow-500 text-black hover:bg-yellow-400 transition-colors text-[10px] uppercase font-bold tracking-wider text-center"
                >
                  Перейти в профиль
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модальное окно детального просмотра */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-xl w-full relative font-mono text-xs space-y-4"
            >
              <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <span className={`text-[10px] block uppercase ${getCategoryStyles(selectedNews.category).text}`}>
                    // {selectedNews.category} // {selectedNews.date}
                  </span>
                  <h3 className="text-base font-black uppercase mt-1 tracking-tight">
                    {selectedNews.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="text-gray-500 hover:text-white transition-colors duration-200"
                >
                  [ ЗАКРЫТЬ ]
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-black/30 border border-white/5 p-4 text-gray-300 leading-relaxed">
                  {selectedNews.content}
                </div>

                <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-none">
                  <span className="text-emerald-400 font-bold block mb-1">
                    // ACT_ADVICE:
                  </span>
                  <p className="text-emerald-300/90 leading-relaxed">
                    {selectedNews.advice}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5 font-mono text-xs">
          <div>
            <span className="text-[10px] text-yellow-500 block uppercase tracking-[0.2em] mb-1">
              [ global_market_feed // live_data ]
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">
              Сегодняшние рыночные тренды
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[10px] uppercase font-bold tracking-wider"
            >
              [ SYNC_FEED ]
            </button>
            <Link href="/profile">
              <button className="px-3 py-2 border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500 hover:text-white transition-all text-[10px] uppercase font-bold tracking-wider">
                [ НАЗАД В КАБИНЕТ ]
              </button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10px] text-gray-500 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncStatus === "ONLINE" ? "bg-emerald-400" : "bg-yellow-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${syncStatus === "ONLINE" ? "bg-emerald-500" : "bg-yellow-500"}`} />
            </span>
            <span>FEED STATUS: <span className="text-white font-bold">{syncStatus}</span></span>
          </div>
          <div>LOCATION NODE: <span className="text-white font-bold">CHIȘINĂU, MDA</span></div>
          <div>LAST_UPDATE: <span className="text-white font-bold">{new Date().toLocaleTimeString()}</span></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 font-mono">
            <div className="w-8 h-8 border-2 border-t-yellow-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 uppercase tracking-widest animate-pulse">
              Чтение структуры глобального капитала...
            </span>
          </div>
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {news.map((item) => {
              const styles = getCategoryStyles(item.category);
              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  onClick={() => setSelectedNews(item)}
                  className={`border ${styles.border} bg-black/20 hover:bg-black/40 backdrop-blur-md p-6 rounded-none relative font-mono flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/[0.02] group`}
                >
                  <div className={`absolute top-0 right-0 w-2 h-2 ${styles.text.replace("text-", "bg-")}`} />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className={`font-bold uppercase ${styles.text}`}>
                        // {item.category}
                      </span>
                      <span className="text-gray-600">{item.date}</span>
                    </div>

                    <h2 className="text-xs font-black tracking-wider text-white uppercase line-clamp-2 border-b border-white/5 pb-2 group-hover:text-yellow-500 transition-colors">
                      {item.title}
                    </h2>

                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-4">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 bg-[#0e0f13]/40 p-3">
                    <span className="text-emerald-400 text-[9px] block mb-1">
                      // ADVICE_LOG:
                    </span>
                    <p className="text-[10px] text-emerald-300/80 line-clamp-2 leading-relaxed italic">
                      {item.advice}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto flex justify-between items-center border-t border-white/5 pt-4 font-mono text-[10px] text-gray-600 mt-12">
        <div>CORE TERMINAL NODE FEED // {new Date().getFullYear()}</div>
        <div>FINORA INSIGHTS v1.1</div>
      </footer>
    </div>
  );
}