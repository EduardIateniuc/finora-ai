"use client";

import React, { useState, useEffect } from "react";

export default function TelemetryProfile() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("USER");
  const [salary, setSalary] = useState(25000);
  const [expenses, setExpenses] = useState(12000);
  const [savingsTarget, setSavingsTarget] = useState(5000);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("finora_user_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nickname) setUsername(parsed.nickname.toUpperCase());
        if (parsed.income) setSalary(Number(parsed.income));
        if (parsed.expenses) setExpenses(Number(parsed.expenses));
        if (parsed.savings) setSavingsTarget(Number(parsed.savings));
      } catch (e) {
        console.error("Failed to load user telemetry", e);
      }
    }
  }, []);

  const handleUpdate = (field, value) => {
    const numValue = Number(value) || 0;
    
    if (field === "salary") setSalary(numValue);
    if (field === "expenses") setExpenses(numValue);
    if (field === "savingsTarget") setSavingsTarget(numValue);

    const saved = localStorage.getItem("finora_user_data");
    let currentData = {};
    if (saved) {
      try {
        currentData = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const updatedData = {
      ...currentData,
      income: field === "salary" ? numValue : salary,
      expenses: field === "expenses" ? numValue : expenses,
      savings: field === "savingsTarget" ? numValue : savingsTarget,
    };

    localStorage.setItem("finora_user_data", JSON.stringify(updatedData));
  };

  const fetchAiRecommendations = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary,
          expenses,
          savingsTarget,
          inflation: 5.8, // Базовая инфляция РМ
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setAiAnalysis(data);
    } catch (error) {
      console.error("Failed to query Finora AI:", error);
      setAiAnalysis({
        investmentRecommendation: `Оптимальная стратегия для ${username}: направлять доступные $${Math.max(0, salary - expenses - savingsTarget)} в Государственные ценные бумаги eVMS.md (7.85% годовых) для надежного хеджирования локальной инфляции без уплаты подоходного налога.`,
        loanAdvice: "Лимиты вашего долгового коэффициента стабильны. Старайтесь избегать долгосрочной переплаты по потребительским кредитам.",
        identifiedRisks: "Связь со спутником стабильна. Рекомендуется диверсификация накоплений: 60% в консервативные ГЦБ РМ, 40% на депозитах."
      });
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchAiRecommendations();
    }
  }, [salary, expenses, savingsTarget, isMounted]);

  const availableForInvest = Math.max(0, salary - expenses - savingsTarget);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* ЛЕВАЯ КОЛОНКА: УПРАВЛЕНИЕ ТЕЛЕМЕТРИЕЙ ПРОФИЛЯ */}
      <section className="lg:col-span-5 space-y-6">
        <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative">
          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
          <h2 className="text-sm font-mono text-yellow-500 uppercase tracking-widest mb-6">
            [ TELEMETRY_PROFILE_EDIT ]
          </h2>

          <div className="space-y-6 text-xs md:text-sm">
            <div>
              <label className="text-xs text-gray-500 font-mono block mb-2">
                // ЕЖЕМЕСЯЧНЫЙ ДОХОД (MDL)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => handleUpdate("salary", e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-xl font-mono text-white outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 font-mono block mb-2">
                // ФИКСИРОВАННЫЕ РАСХОДЫ (MDL)
              </label>
              <input
                type="number"
                value={expenses}
                onChange={(e) => handleUpdate("expenses", e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-xl font-mono text-white outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 font-mono block mb-2">
                // ЦЕЛЕВЫЕ НАКОПЛЕНИЯ В МЕСЯЦ (MDL)
              </label>
              <input
                type="number"
                value={savingsTarget}
                onChange={(e) => handleUpdate("savingsTarget", e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-xl font-mono text-white outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
            <div className="flex justify-between text-xs font-mono text-gray-400">
              <span>СВОБОДНЫЙ ИНВЕСТ-КАПИТАЛ:</span>
              <span className="font-bold text-emerald-400">
                {availableForInvest.toLocaleString()} MDL
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, ((salary - expenses) / (salary || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="lg:col-span-7">
        <div className="border border-yellow-500/20 bg-black/25 backdrop-blur-md p-6 rounded-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-mono text-yellow-500 uppercase tracking-widest">
              [ FINORA_DAILY_INVESTMENT_DECISION ]
            </h2>

            <button
              onClick={fetchAiRecommendations}
              disabled={loadingAi}
              className="group relative overflow-hidden border border-white px-4 py-2 font-mono tracking-wider text-[11px] uppercase text-white hover:text-black transition-colors duration-300 disabled:opacity-50"
            >
              <span className="relative z-10">
                {loadingAi ? "Расчет..." : "Обновить ИИ"}
              </span>
              <div className="absolute bottom-0 left-0 h-full w-full bg-white origin-bottom scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100 z-0" />
            </button>
          </div>

          {aiAnalysis ? (
            <div className="space-y-6 font-mono text-xs">
              <div className="p-4 bg-white/5 border border-white/5 leading-relaxed">
                <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">
                  // РЕКОМЕНДУЕМЫЙ ИНСТРУМЕНТ ДНЯ
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {aiAnalysis.investmentRecommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 leading-relaxed">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                    // СТРАТЕГИЯ КРЕДИТОВАНИЯ
                  </h4>
                  <p className="text-gray-400 leading-relaxed">{aiAnalysis.loanAdvice}</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 leading-relaxed">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">
                    // СИСТЕМНЫЕ РИСКИ
                  </h4>
                  <p className="text-gray-400 leading-relaxed">{aiAnalysis.identifiedRisks}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 font-mono text-xs">
              Ожидание аналитики от ИИ Finora...
            </div>
          )}
        </div>
      </section>

    </div>
  );
}