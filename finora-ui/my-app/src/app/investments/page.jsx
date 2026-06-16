"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function InvestmentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("USER");
  const [userData, setUserData] = useState(null);

  // Стейты ИИ
  const [investmentsData, setInvestmentsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [displayedAdvice, setDisplayedAdvice] = useState("");

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

  // ИСПРАВЛЕНО: Локальный расчет профицита с учетом транзакций
  const baseSalary = userData ? (Number(userData.baseIncome ?? userData.income) || 0) : 25000;
  const baseExpenses = userData ? (Number(userData.baseExpenses ?? userData.expenses) || 0) : 12000;
  
  const txList = userData?.transactions || [];
  const txIncome = txList.filter(t => t.type === "income").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const txExpenses = txList.filter(t => t.type === "outcome").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const netTransactions = txIncome - txExpenses;

  const surplus = Math.max(0, baseSalary - baseExpenses + netTransactions);

  const typeText = async (text) => {
    let currentText = "";
    const chars = Array.from(text);
    let idx = 0;
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (idx < chars.length) {
          const chunk = chars.slice(idx, idx + 3).join("");
          currentText += chunk;
          setDisplayedAdvice(currentText);
          idx += 3;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 15);
    });
  };

  const fetchInvestments = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      // ИСПРАВЛЕНО: Передача структурированных финансовых данных в API
      const response = await fetch("/api/gemini/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: baseSalary,
          baseExpenses: baseExpenses,
          netTransactions: netTransactions,
          nickname: username,
          goalName: userData?.goalName || "Tesla Y",
        }),
      });
      const data = await response.json();
      setInvestmentsData(data);
      setLoading(false);
      await typeText(data.investmentRecommendation || "");
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && userData) {
      fetchInvestments();
    }
  }, [isMounted, userData]);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  return (
    <div className="min-h-screen bg-[#0e0f13] text-white font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Modal Station */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-xl w-full relative font-mono text-xs space-y-4">
              <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <span className="text-yellow-500 text-[10px] block">// HANDSHAKE_STATION_CONNECTED</span>
                  <h3 className="text-base font-black uppercase mt-1">{activeModal.title}</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-500">[ ЗАКРЫТЬ ]</button>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 space-y-2">
                <p>// Платформа: <span className="text-white font-bold">{activeModal.platform}</span></p>
                <p>// Доходность: <span className="text-emerald-400 font-bold">+{activeModal.yieldRate}% годовых</span></p>
                <p>// Вход от: <span className="text-white">${activeModal.minEntry}</span></p>
                <p className="text-gray-400 leading-relaxed pt-2">{activeModal.description}</p>
              </div>
              <a href={activeModal.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400 transition-colors inline-block text-center w-full">
                Открыть платформу ↗
              </a>
            </div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">

        <header className="flex justify-between items-center border-b border-white/5 pb-4 font-mono text-xs text-gray-500">
          <div>[ global_investments_hub // investments ]</div>
          <div className="flex gap-3">
            {/* ДОБАВЛЕНО: Кнопка перехода к супер-советам ИИ */}
            <Link href="/profile/advices">
              <button className="text-xs uppercase text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 hover:bg-emerald-500/10">[ СОВЕТЫ FINORA // ADVICES ]</button>
            </Link>
            <Link href="/profile">
              <button className="text-xs uppercase text-yellow-500 border border-yellow-500/20 bg-yellow-500/5 px-3 py-1.5 hover:bg-yellow-500/10">[ НАЗАД В КАБИНЕТ ]</button>
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono">
            <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
            <h2 className="text-sm text-yellow-500 uppercase tracking-widest mb-4">[ GLOBAL_WEALTH_INDEX ]</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
              "Для защиты твоего профицита в <span className="text-emerald-400 font-semibold">${surplus.toLocaleString()}</span> от инфляции, я подобрала безопасные мировые инструменты для диверсификации капитала вне локального рынка Молдовы:"
            </p>

            {loading ? (
              <div className="text-center py-12 text-gray-500 font-mono text-xs animate-pulse">Построение глобальной матрицы активов...</div>
            ) : investmentsData?.globalInvestments?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {investmentsData.globalInvestments.map((inv, idx) => (
                  <div key={idx} onClick={() => setActiveModal(inv)} className="border border-emerald-500/10 bg-emerald-500/5 p-4 font-mono text-xs space-y-2 cursor-pointer hover:border-emerald-500/50 transition-all">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-bold text-white">{inv.title}</span>
                      <span className="text-emerald-400 font-black">+{inv.yieldRate}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 line-clamp-3">{inv.description}</p>
                    <div className="flex justify-between text-[10px] text-gray-500 pt-2 border-t border-white/5">
                      <span>Платформа: {inv.platform}</span>
                      <span>Вход: ${inv.minEntry}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* ИИ Анализ */}
          {investmentsData && (
            <div className="border border-yellow-500/20 bg-black/25 backdrop-blur-md p-6 font-mono text-xs leading-relaxed relative">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">// Сводный совет Finora по инвестированию</h3>
              <p className="whitespace-pre-wrap">{displayedAdvice}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}