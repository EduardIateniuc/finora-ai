"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const DIFFICULTY_STYLES = {
  LOW: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  MEDIUM: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
  HIGH: "text-rose-400 border-rose-500/20 bg-rose-500/5",
};

export default function AdvicesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("USER");
  const [userData, setUserData] = useState(null);

  // Стейты ИИ
  const [advicesData, setAdvicesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayedSummary, setDisplayedAnalysis] = useState("");
  const [pinnedSuccess, setPinnedSuccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("finora_user_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserData(parsed);
        if (parsed.nickname) setUsername(parsed.nickname.toUpperCase());
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

  const fetchAdvices = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/advices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: userData.income ? Number(userData.income) : 25000,
          expenses: userData.expenses ? Number(userData.expenses) : 12000,
          savings: userData.baseSavings ? Number(userData.baseSavings) : 5000,
          nickname: username,
          goals: userData.goals || [],
          transactions: userData.transactions || [],
        }),
      });
      const data = await response.json();
      setAdvicesData(data);
      setLoading(false);
      if (data.summary) {
        await typeText(data.summary);
      }
    } catch (e) {
      console.error("Failed to load global advices:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && userData) {
      fetchAdvices();
    }
  }, [isMounted, userData]);

  const handlePinAdvice = (text) => {
    localStorage.setItem("finora_pinned_advice", text);
    setPinnedSuccess(true);
    setTimeout(() => setPinnedSuccess(false), 2000);
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  // Расчет профицита
  const surplus = userData ? (Number(userData.income) - Number(userData.expenses)) : 13000;

  // Модель сложного процента при консервативной ставке 8% годовых
  const calcCompoundingValue = (monthlyAmount, years) => {
    const annualRate = 0.08;
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    if (monthlyAmount <= 0) return 0;
    return Math.round(monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
  };

  const projection1Yr = calcCompoundingValue(surplus, 1);
  const projection3Yr = calcCompoundingValue(surplus, 3);
  const projection5Yr = calcCompoundingValue(surplus, 5);

  return (
    <div className="min-h-screen bg-[#0e0f13] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/44 z-[1]" />

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Хедер */}
        <header className="flex justify-between items-center border-b border-white/5 pb-4 font-mono text-xs text-gray-500">
          <div>[ global_financial_advices // blueprint ]</div>
          <Link href="/profile">
            <button className="text-xs uppercase text-yellow-500 hover:text-white transition-colors">[ НАЗАД В КАБИНЕТ ]</button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ЛЕВАЯ ПАНЕЛЬ: АНАЛИЗ ТЕЛЕМЕТРИИ И СЛОЖНЫЙ ПРОЦЕНТ */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Телеметрия */}
            <section className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono text-xs space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
              <h3 className="text-xs text-emerald-400 uppercase tracking-widest mb-4">[ FINANCIAL_HEALTH_DIAGNOSTIC ]</h3>
              
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">ДОХОДЫ (TOTAL):</span>
                <span className="text-white font-bold">${userData?.income?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">РАСХОДЫ (TOTAL):</span>
                <span className="text-rose-400 font-semibold">${userData?.expenses?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500 text-yellow-500 font-bold">ПРОФИЦИТ:</span>
                <span className="text-yellow-500 font-black">${surplus.toLocaleString()} / мес.</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-500">АКТИВНЫХ ЦЕЛЕЙ:</span>
                <span className="text-white font-semibold">{userData?.goals?.length || 0}</span>
              </div>
            </section>

            {/* Расчет сложного процента */}
            <section className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono text-xs space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h3 className="text-xs text-yellow-500 uppercase tracking-widest mb-4">[ COMPOUND_GROWTH_PROJECTION ]</h3>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Если вы будете инвестировать ваш ежемесячный профицит в размере <span className="text-white font-bold">${surplus.toLocaleString()}</span> под средние консервативные 8% годовых:
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">ЧЕРЕЗ 1 ГОД:</span>
                  <span className="text-emerald-400 font-bold">${projection1Yr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">ЧЕРЕЗ 3 ГОДА:</span>
                  <span className="text-emerald-400 font-bold">${projection3Yr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400">ЧЕРЕЗ 5 ЛЕТ:</span>
                  <span className="text-yellow-500 font-black">${projection5Yr.toLocaleString()}</span>
                </div>
              </div>
            </section>

          </div>

          {/* ПРАВАЯ ПАНЕЛЬ: СТРАТЕГИИ И ИНСТРУМЕНТЫ */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* ИИ Диагноз */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h2 className="text-xs text-yellow-500 uppercase tracking-widest mb-4">[ COGNITIVE_DIAGNOSTIC_SUMMARY ]</h2>
              
              {loading ? (
                <div className="text-center py-6 text-gray-500 text-xs animate-pulse">Анализ всей финансовой сети аккаунта...</div>
              ) : (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 text-xs leading-relaxed text-gray-300">
                  <span className="text-yellow-500 font-bold block mb-2">// ВЕРДИКТ ИИ:</span>
                  <p className="whitespace-pre-wrap">{displayedSummary || "Обработка СУБД логов..."}</p>
                </div>
              )}
            </div>

            {/* Карточка быстрого закрепления совета */}
            {advicesData?.pinnableAdvice && (
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-6 rounded-none font-mono text-xs relative space-y-4">
                <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
                <h3 className="text-emerald-400 font-bold tracking-widest">// СТРАТЕГИЧЕСКИЙ СОВЕТ ДЛЯ ПРОФИЛЯ</h3>
                <p className="text-white italic bg-black/20 p-3 border border-white/5 leading-relaxed">
                  "{advicesData.pinnableAdvice}"
                </p>
                
                <button 
                  onClick={() => handlePinAdvice(advicesData.pinnableAdvice)}
                  className="px-4 py-2 bg-emerald-500 text-black font-bold uppercase hover:bg-emerald-400 transition-colors w-full"
                >
                  {pinnedSuccess ? "[ ✓ СОВЕТ УСПЕШНО ЗАКРЕПЛЕН ]" : "[ ЗАКРЕПИТЬ СОВЕТ В КАБИНЕТЕ ]"}
                </button>
              </div>
            )}

            {/* Рекомендуемые инструменты */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
              <h2 className="text-xs text-emerald-400 uppercase tracking-widest mb-4">[ WEALTH_MAXIMIZATION_TACTICS ]</h2>
              
              {loading ? (
                <div className="text-center py-12 text-gray-500 text-xs animate-pulse">Расчет инвестиционной матрицы низкого риска...</div>
              ) : advicesData?.strategies?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {advicesData.strategies.map((strat, idx) => {
                    const diffClass = DIFFICULTY_STYLES[strat.difficulty] || DIFFICULTY_STYLES.MEDIUM;
                    return (
                      <div key={idx} className="border border-white/5 bg-black/40 p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="font-bold text-white uppercase text-[11px] truncate">{strat.title}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-4">{strat.description}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex flex-col space-y-2 text-[9px]">
                          <div className="flex justify-between text-gray-500">
                            <span>Биржа/Брокер:</span>
                            <span className="text-white font-bold">{strat.platform}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`${diffClass} px-1 py-0.5 border font-bold`}>СЛОЖНОСТЬ: {strat.difficulty}</span>
                            <span className="text-emerald-400 font-extrabold">{strat.expectedYield}</span>
                          </div>
                          
                          <a 
                            href={strat.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-2 text-center py-1 border border-white/15 bg-white/5 hover:bg-white/10 hover:text-white transition-all text-[9px] uppercase font-bold"
                          >
                            Платформа ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* План распределения бюджета */}
            {advicesData?.allocationPlan && (
              <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono space-y-3 text-xs leading-relaxed">
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
                <h3 className="text-xs text-yellow-500 uppercase tracking-widest mb-3">[ TACTICAL_BUDGET_ALLOCATION ]</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{advicesData.allocationPlan}</p>
              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}