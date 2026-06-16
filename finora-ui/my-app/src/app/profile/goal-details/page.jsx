"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CONDITION_STYLES = {
  NEW: { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", label: "НОВЫЙ ТОВАР // ДИЛЕР" },
  USED: { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", label: "ВТОРИЧНЫЙ РЫНОК // 999.MD" },
};

export default function GoalDetailsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("USER");
  const [userData, setUserData] = useState(null);

  // Стейты ИИ
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayedAnalysis, setDisplayedAnalysis] = useState("");
  
  // Управление вкладками фильтрации: "all" | "new" | "used"
  const [activeTab, setActiveTab] = useState("all");

  // Модальное окно кредитного выбора
  const [showLoanDecisionModal, setShowLoanDecisionModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("finora_user_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserData(parsed);
        if (parsed.nickname) setUsername(parsed.nickname.toUpperCase());
        // Открываем модальное окно принятия решения
        setShowLoanDecisionModal(true);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const typeText = async (text) => {
    let currentText = "";
    const chars = Array.from(text);
    let idx = 0;
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (idx < chars.length) {
          const chunk = chars.slice(idx, idx + 3).join("");
          currentText += chunk;
          setDisplayedAnalysis(currentText);
          idx += 3;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 15);
    });
  };

  const fetchMarketDeals = async () => {
    if (!userData) return;
    setLoading(true);

    const activeGoal = userData?.goals?.[0] || { name: "Смартфон", target: 1000, saved: 0 };
    const currentGoalName = userData?.goalName || activeGoal.name || "Смартфон";
    const currentGoalAmount = userData?.goalTargetAmount ? Number(userData.goalTargetAmount) : (Number(activeGoal.target) || 1000);

    try {
      const response = await fetch("/api/gemini/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: username,
          goalName: currentGoalName,
          goalTargetAmount: currentGoalAmount,
        }),
      });
      const data = await response.json();
      setMarketData(data);
      setLoading(false);
      if (data.marketAnalysis) {
        await typeText(data.marketAnalysis);
      }
    } catch (e) {
      console.error("Failed to load market intelligence:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && userData) {
      fetchMarketDeals();
    }
  }, [isMounted, userData]);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  // Расчеты параметров накопления
  const surplus = userData ? (Number(userData.income) - Number(userData.expenses)) : 13000;
  const activeGoal = userData?.goals?.[0] || { name: "Смартфон", target: 1000, saved: 0 };
  const goalName = userData?.goalName || activeGoal.name || "Смартфон";
  const goalTargetAmount = userData?.goalTargetAmount ? Number(userData.goalTargetAmount) : (Number(activeGoal.target) || 1000);
  const savings = userData?.savings ? Number(userData.savings) : (Number(activeGoal.saved) || 0);
  const monthsToGoal = surplus > 0 ? Math.ceil(Math.max(0, goalTargetAmount - savings) / surplus) : 99;
  const remainingAmount = Math.max(0, goalTargetAmount - savings);

  // Формирование списков предложений
  const newDeals = marketData?.newDeals || [];
  const usedDeals = marketData?.usedDeals || [];

  const allDeals = [
    ...newDeals.map(d => ({ ...d, condition: "NEW" })),
    ...usedDeals.map(d => ({ ...d, condition: "USED" }))
  ];

  const filteredDeals = allDeals.filter(deal => {
    if (activeTab === "new") return deal.condition === "NEW";
    if (activeTab === "used") return deal.condition === "USED";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0e0f13] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/44 z-[1]" />

      {/* === MODAL: КРЕДИТНОЕ РЕШЕНИЕ === */}
      <AnimatePresence>
        {showLoanDecisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="border border-rose-500 bg-[#0e0f13] p-8 max-w-md w-full relative font-mono text-xs space-y-6"
            >
              <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500" />
              <div className="border-b border-white/10 pb-3">
                <span className="text-rose-400 text-[10px] block font-bold">// DEBT_FINANCING_EVALUATION // TARGET_ID: {goalName.toUpperCase()}</span>
                <h3 className="text-sm font-black uppercase mt-1 tracking-tight">Финансирование через Кредит</h3>
              </div>

              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Для реализации вашей цели <span className="text-white">"{goalName}"</span> стоимостью <span className="text-yellow-500">${goalTargetAmount.toLocaleString()}</span> осталось накопить <span className="text-rose-400">${remainingAmount.toLocaleString()}</span>.
                </p>
                <p>
                  Вы можете задействовать кредитное плечо от банков Республики Молдова для немедленного приобретения актива, либо продолжить накопление за счет собственного профицита бюджета (${surplus.toLocaleString()}/мес).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowLoanDecisionModal(false)}
                  className="py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wider text-center"
                >
                  Продолжить копить
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("finora_loan_redirect", "true");
                    router.push("/loans");
                  }}
                  className="py-2.5 bg-rose-500 text-white hover:bg-rose-400 transition-colors text-[10px] uppercase font-bold tracking-wider text-center"
                >
                  Оценить кредит →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Хедер страницы */}
        <header className="flex justify-between items-center border-b border-white/5 pb-4 font-mono text-xs text-gray-500">
          <div>[ objective_market_intelligence // custom_deals ]</div>
          <Link href="/profile">
            <button className="text-xs uppercase text-yellow-500 hover:text-white transition-colors">[ НАЗАД В КАБИНЕТ ]</button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ЛЕВАЯ ПАНЕЛЬ: ФИНАНСОВЫЕ ХАРАКТЕРИСТИКИ */}
          <section className="lg:col-span-4 border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono text-xs space-y-4">
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
            <h3 className="text-xs text-yellow-500 uppercase tracking-widest mb-4">[ HORIZON_MATHEMATICS ]</h3>
            
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">ЦЕЛЬ НАКОПЛЕНИЯ:</span>
              <span className="text-white font-bold">{goalName}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">ЦЕЛЕВОЙ БЮДЖЕТ:</span>
              <span className="text-yellow-500 font-semibold">${goalTargetAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">НАКОПЛЕНО В ЦЕЛИ:</span>
              <span className="text-emerald-400 font-semibold">${savings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">АКТИВНЫЙ ПРОФИЦИТ:</span>
              <span className="text-white font-semibold">${surplus.toLocaleString()} / мес.</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500 font-bold text-yellow-500">РАСЧЕТНЫЙ СРОК:</span>
              <span className="text-white font-black">{monthsToGoal} мес.</span>
            </div>
          </section>

          {/* ПРАВАЯ ПАНЕЛЬ: ОБЗОР РЫНКА И КАРТОЧКИ С ФИЛЬТРОМ */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* ИИ Аналитика */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h2 className="text-xs text-yellow-500 uppercase tracking-widest mb-4">[ MARKET_INTELLIGENCE_REPORT ]</h2>
              
              {loading ? (
                <div className="text-center py-6 text-gray-500 text-xs animate-pulse">Анализ рыночных параметров в Молдове на 2026 год...</div>
              ) : (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 text-xs leading-relaxed text-gray-300">
                  <span className="text-yellow-500 font-bold block mb-2">// МАКРОЭКОНОМИЧЕСКИЙ ОБЗОР (РМ):</span>
                  <p className="whitespace-pre-wrap">{displayedAnalysis || "Формирование векторов аналитики..."}</p>
                </div>
              )}
            </div>

            {/* Фильтр-бары */}
            <div className="flex flex-wrap gap-2 font-mono text-[10px]">
              <button 
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 border transition-all ${activeTab === "all" ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-white/10 bg-white/2 text-gray-500 hover:text-white"}`}
              >
                [ ВСЕ ВАРИАНТЫ ({allDeals.length}) ]
              </button>
              <button 
                onClick={() => setActiveTab("new")}
                className={`px-4 py-2 border transition-all ${activeTab === "new" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/2 text-gray-500 hover:text-white"}`}
              >
                [ ОФИЦИАЛЬНЫЕ ДИЛЕРЫ ({newDeals.length}) ]
              </button>
              <button 
                onClick={() => setActiveTab("used")}
                className={`px-4 py-2 border transition-all ${activeTab === "used" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/10 bg-white/2 text-gray-500 hover:text-white"}`}
              >
                [ ВТОРИЧНЫЙ РЫНОК 999.MD ({usedDeals.length}) ]
              </button>
            </div>

            {/* Сетка предложений */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
              <h2 className="text-xs text-emerald-400 uppercase tracking-widest mb-4">[ TARGET_DEALS_IDENTIFIED ]</h2>
              
              {loading ? (
                <div className="text-center py-12 text-gray-500 text-xs animate-pulse">Генерация карточек выгодных предложений...</div>
              ) : filteredDeals.length > 0 ? (
                <motion.div 
                  layout 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredDeals.map((deal, idx) => {
                      const isNew = deal.condition === "NEW";
                      const styles = isNew 
                        ? { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", label: `ДИЛЕР: ${deal.dealerName || "РМ"}` }
                        : { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", label: "ВТОРИЧНЫЙ РЫНОК // 999.MD" };

                      const targetPrice = Number(deal.price) || 1;
                      const progressPercent = Math.min(100, Math.round((savings / targetPrice) * 100));
                      const isReady = savings >= targetPrice;
                      const remaining = Math.max(0, targetPrice - savings);

                      return (
                        <motion.div
                          key={deal.title + idx}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={`border ${styles.border} ${styles.bg} p-5 flex flex-col justify-between space-y-4 relative`}
                        >
                          <div className="absolute top-0 right-0 w-2 h-2 bg-white/20" />
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-start border-b border-white/5 pb-2">
                              <h3 className="font-bold text-white uppercase tracking-tight text-xs max-w-[70%] leading-tight">
                                {deal.title}
                              </h3>
                              <span className={`text-[8px] font-bold ${styles.text} border ${styles.border} px-1.5 py-0.5 whitespace-nowrap`}>
                                {styles.label}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                              {deal.description}
                            </p>
                          </div>

                          {/* Индикатор прогресса накоплений */}
                          <div className="space-y-1 pt-2 border-t border-white/5">
                            <div className="flex justify-between text-[9px]">
                              <span className="text-gray-500">Прогресс выкупа:</span>
                              <span className={isReady ? "text-emerald-400 font-bold" : "text-yellow-500"}>
                                {progressPercent}% {isReady && "(ДОСТУПНО)"}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-white/10 relative overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${isReady ? "bg-emerald-400" : "bg-yellow-500"}`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            {!isReady && (
                              <span className="text-[9px] text-rose-400/80 block pt-0.5">
                                Нужно накопить еще: ${remaining.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 flex justify-between items-center">
                            <div>
                              <span className="text-[9px] text-gray-500 block uppercase">Стоимость актива:</span>
                              <span className="text-white font-black text-sm">${targetPrice.toLocaleString()}</span>
                            </div>
                            
                            <a 
                              href={deal.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:text-white text-gray-300 transition-all text-[10px] uppercase font-bold tracking-wider"
                            >
                              Купить ↗
                            </a>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center py-6 text-gray-600 text-xs">
                  // Спецификации не найдены. Выполните синхронизацию данных.
                </div>
              )}
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}