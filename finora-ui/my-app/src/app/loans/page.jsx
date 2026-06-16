"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const DEFAULT_BANKS = [
  { id: "maib_consum", name: "maib (Consumer)", rate: 9.00, dae: 9.38, maxAmount: 400000, type: "Потребительский", url: "https://maib.md/ro/individuals/credits/consumer-credit/", features: "Быстрое одобрение онлайн", earlyRepayment: "Без ограничений" },
  { id: "micb_consum", name: "Moldindconbank (Consum)", rate: 8.50, dae: 8.83, maxAmount: 400000, type: "Потребительский", url: "https://www.micb.md/credite/credit-de-consum", features: "Одобрение за 1 час", earlyRepayment: "Без ограничений" }
];

export default function LoansPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("USER");
  const [userData, setUserData] = useState(null);

  // Параметры кредита
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanTerm, setLoanTerm] = useState(24);
  const [selectedBank, setSelectedBank] = useState(DEFAULT_BANKS[0]);

  // Стейты ИИ и модалки
  const [loansData, setLoansData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [displayedAdvice, setDisplayedAdvice] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("finora_user_data");
    const redirected = localStorage.getItem("finora_loan_redirect") === "true";

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserData(parsed);
        if (parsed.nickname) setUsername(parsed.nickname.toUpperCase());

        // ИСПРАВЛЕНО: Автоматически устанавливаем остаток суммы под цель, если перешли с модального окна
        const activeGoal = parsed.goals?.[0] || { name: "Смартфон", target: 1000, saved: 0 };
        const goalTargetAmount = parsed.goalTargetAmount ? Number(parsed.goalTargetAmount) : (Number(activeGoal.target) || 1000);
        const savings = parsed.savings ? Number(parsed.savings) : (Number(activeGoal.saved) || 0);
        const remainingAmount = Math.max(0, goalTargetAmount - savings);

        if (redirected && remainingAmount > 0) {
          setLoanAmount(remainingAmount);
        }
        localStorage.removeItem("finora_loan_redirect"); // Очищаем временный флаг
      } catch (e) {
        console.error("Failed to load user credentials", e);
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
          setDisplayedAdvice(currentText);
          idx += 3;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 15);
    });
  };

  const fetchLoans = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: userData?.income ? Number(userData.income) : 25000,
          expenses: userData?.expenses ? Number(userData.expenses) : 12000,
          loanAmount: loanAmount,
          loanTerm: loanTerm,
          nickname: username,
          goalName: userData?.goalName || "Смартфон",
          goalTargetAmount: userData?.goalTargetAmount || 1000,
        }),
      });

      const data = await response.json();
      setLoansData(data);
      if (data.banks?.length > 0) setSelectedBank(data.banks[0]);

      setLoading(false);
      await typeText(data.loanAdvice || "");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const monthlyPaymentCalc = (amount, rate, term) => {
    const monthlyRate = (rate / 100) / 12;
    return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  };

  const currentBankRate = selectedBank ? selectedBank.rate : 8.5;
  const calculatedPayment = monthlyPaymentCalc(loanAmount, currentBankRate, loanTerm);
  const calculatedOverpayment = calculatedPayment * loanTerm - loanAmount;
  const dtiRatio = userData?.income ? Math.round((calculatedPayment / Number(userData.income)) * 100) : 0;

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
                  <h3 className="text-base font-black uppercase mt-1">{activeModal.name}</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-500">
                  [ ЗАКРЫТЬ ]
                </button>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 space-y-2">
                <p>// Ставка: <span className="text-white font-bold">{activeModal.rate}%</span> (DAE: <span className="text-yellow-500">{activeModal.dae}%</span>)</p>
                <p>// Свойства: <span className="text-gray-300">{activeModal.features}</span></p>
                <p>// Досрочное погашение: <span className="text-gray-300">{activeModal.earlyRepayment}</span></p>
              </div>
              <a href={activeModal.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400 transition-colors inline-block text-center w-full">
                Перейти на сайт банка ↗
              </a>
            </div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex justify-between items-center border-b border-white/5 pb-4 font-mono text-xs text-gray-500">
          <div>[ client_loans_hub // loans ]</div>
          <Link href="/profile">
            <button className="text-xs uppercase text-yellow-500">[ НАЗАД В КАБИНЕТ ]</button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Слайдеры */}
          <section className="lg:col-span-5 border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative space-y-6">
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
            <h2 className="text-xs font-mono text-yellow-500 uppercase tracking-widest">[ LOAN_STATION ]</h2>
            
            {/* ИСПРАВЛЕНО: Информационный блок о кредитуемой цели */}
            {userData?.goalName && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-[10px] text-rose-400 font-mono">
                // ЦЕЛЬ КРЕДИТОВАНИЯ: {userData.goalName.toUpperCase()} <br />
                // ТРЕБУЕМЫЙ РЕЗЕРВ: ${loanAmount.toLocaleString()}
              </div>
            )}

            <div className="space-y-6 font-mono text-xs">
              <div>
                <label className="text-gray-500 block mb-2">// СУММА КРЕДИТА ($)</label>
                <input 
                  type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-xl font-mono text-white outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="text-gray-500 block mb-2">// СРОК (МЕСЯЦЫ)</label>
                <input 
                  type="number" value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-xl font-mono text-white outline-none focus:border-yellow-500"
                />
              </div>
              <button onClick={fetchLoans} disabled={loading} className="w-full py-3 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400 transition-colors">
                {loading ? "Анализ предложений..." : "Оценить кредитный риск →"}
              </button>
            </div>
          </section>

          {/* Результаты ИИ */}
          <section className="lg:col-span-7 space-y-6">
            {loansData ? (
              <div className="space-y-6">
                <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none font-mono text-xs space-y-3 leading-relaxed">
                  <span className="text-yellow-500 font-bold block">// ВЕРДИКТ FINORA ИИ по КРЕДИТОВАНИЮ:</span>
                  <p className="whitespace-pre-wrap">{displayedAdvice}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loansData.banks?.map((bank, idx) => (
                    <div key={idx} onClick={() => setActiveModal(bank)} className="border border-white/5 bg-black/40 p-4 font-mono text-xs space-y-2 cursor-pointer hover:border-yellow-500 transition-all">
                      <span className="font-bold text-white uppercase block">{bank.name}</span>
                      <span className="text-rose-400 font-extrabold">{bank.rate}% (DAE: {bank.dae}%)</span>
                      <p className="text-[10px] text-gray-400 truncate">{bank.features}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 border border-white/10 font-mono text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1 uppercase">// Платеж в месяц:</span>
                    <span className="text-lg font-extrabold text-white">${calculatedPayment.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1 uppercase">// Общая переплата:</span>
                    <span className="text-lg font-extrabold text-rose-400">${calculatedOverpayment.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1 uppercase">// Нагрузка DTI:</span>
                    <span className={`text-lg font-extrabold ${dtiRatio > 40 ? "text-rose-400" : dtiRatio > 25 ? "text-yellow-500" : "text-emerald-400"}`}>{dtiRatio}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-white/10 bg-black/20 backdrop-blur-md p-12 text-center text-gray-500 font-mono text-xs">
                Заполните параметры слева для запуска финансового симулятора.
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}