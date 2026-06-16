"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

export default function ProfilePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Управление модальными окнами: null | "profile" | "add_goal" | "edit_goal" | "add_transaction" | "edit_transaction" | "add_funds"
  const [activeModal, setActiveModal] = useState(null);
  
  // Идентификаторы редактируемых сущностей
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [selectedTxId, setSelectedTxId] = useState(null);

  // Базовые стейты телеметрии (изменяемые)
  const [username, setUsername] = useState("USER");
  const [job, setJob] = useState("NOT_DETECTED");
  const [baseSalary, setBaseSalary] = useState(25000);
  const [baseExpenses, setBaseExpenses] = useState(12000);
  const [baseSavings, setBaseSavings] = useState(5000);

  // СУБД массивы целей и транзакций
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Формы ввода (защищены от undefined через || "")
  const [profileForm, setProfileForm] = useState({ 
    nickname: "", 
    job: "", 
    income: "", 
    expenses: "", 
    savings: "" 
  });
  const [goalForm, setGoalForm] = useState({ name: "", target: "", saved: "" });
  const [transactionForm, setTransactionForm] = useState({ type: "income", category: "", amount: "" });
  const [fundsAmount, setFundsAmount] = useState("");

  // === РАСЧЕТЫ ИТОГОВЫХ СУММ ===
  const txIncomeTotal = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const txExpensesTotal = transactions.filter(t => t.type === "outcome").reduce((acc, t) => acc + t.amount, 0);

  // Доходы = база + доходы по транзакциям
  const finalIncome = baseSalary + txIncomeTotal;
  // Расходы = база + расходы по транзакциям
  const finalExpenses = Math.max(0, baseExpenses + txExpensesTotal);
  
  // Накопления по всем целям
  const goalsSavings = goals.reduce((acc, g) => acc + (g.saved || 0), 0);
  
  // ИСПРАВЛЕНО: Теперь транзакции суммируются в общий объем накоплений
  const netTxSavings = txIncomeTotal - txExpensesTotal;
  const finalSavings = Math.max(0, baseSavings + goalsSavings + netTxSavings);

  const calculatedSurplus = Math.max(0, finalIncome - finalExpenses);
  const efficiencyRate = finalIncome > 0 ? Math.round((calculatedSurplus / finalIncome) * 100) : 0;

  const [pinnedAdvice, setPinnedAdvice] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    loadUserDataFromDatabase();
    
    // Читаем закрепленный совет
    const savedAdvice = localStorage.getItem("finora_pinned_advice");
    if (savedAdvice) {
      setPinnedAdvice(savedAdvice);
    }
  }, []);

  // ИНИЦИАЛИЗАЦИЯ И СВЯЗЬ С БЭКЕНДОМ ЧЕРЕЗ JWT ТОКЕН
  const loadUserDataFromDatabase = async () => {
    const token = localStorage.getItem("finora_auth_token");
    if (!token) {
      router.push("/verification");
      return;
    }

    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      // Запрашиваем актуальный профиль из СУБД по токену авторизации
      const response = await axios.get(`${backendBaseUrl}/api/users/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const dbData = response.data;

      if (dbData.username) setUsername(dbData.username.toUpperCase());
      if (dbData.job) setJob(dbData.job);

      const loadedIncome = Number(dbData.baseIncome) || 0;
      const loadedExpenses = Number(dbData.baseExpenses) || 0;
      const loadedSavings = Number(dbData.baseSavings) || 0;

      setBaseSalary(loadedIncome);
      setBaseExpenses(loadedExpenses);
      setBaseSavings(loadedSavings);

      // Адаптивный маппинг целей из формата БД в формат фронтенда
      const mappedGoals = (dbData.goals || []).map(g => {
        const targetVal = Number(g.target ?? g.price) || 0;
        const savedVal = Number(g.saved ?? g.nacopleno) || 0;
        return {
          id: g.id,
          name: g.name || g.goalName || "",
          target: targetVal,
          // Защитное ограничение при маппинге данных из БД
          saved: Math.min(savedVal, targetVal) 
        };
      });
      setGoals(mappedGoals);

      // Адаптивный маппинг транзакций из формата БД в формат фронтенда
      const mappedTransactions = (dbData.transactions || []).map(t => ({
        id: t.id,
        type: t.type || t.typeOfTransaction || "income",
        category: t.category,
        amount: Number(t.amount ?? t.transactionAmount) || 0,
        date: t.date
      }));
      setTransactions(mappedTransactions);

      // Настраиваем форму редактирования
      setProfileForm({
        nickname: dbData.username || "",
        job: dbData.job || "",
        income: loadedIncome,
        expenses: loadedExpenses,
        savings: loadedSavings
      });

      // Синхронизируем локальный кэш
      const localSync = {
        nickname: dbData.username,
        job: dbData.job,
        income: loadedIncome,
        expenses: loadedExpenses,
        savings: loadedSavings,
        goals: mappedGoals,
        transactions: mappedTransactions
      };
      localStorage.setItem("finora_user_data", JSON.stringify(localSync));

    } catch (e) {
      console.error("Failed to load user credentials from server database:", e);
      // Если сервер не ответил, пытаемся считать локальный кэш
      const saved = localStorage.getItem("finora_user_data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.nickname) setUsername(parsed.nickname.toUpperCase());
          if (parsed.job) setJob(parsed.job);
          setBaseSalary(Number(parsed.baseIncome ?? parsed.income) || 25000);
          setBaseExpenses(Number(parsed.baseExpenses ?? parsed.expenses) || 12000);
          setBaseSavings(Number(parsed.baseSavings ?? parsed.savings) || 5000);
          setGoals(parsed.goals || []);
          setTransactions(parsed.transactions || []);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  // Вспомогательный метод сохранения и пересчета финансовой математики на бэкенд
  const saveAllToDatabase = async (
    updatedGoals,
    updatedTransactions,
    updatedNickname = username,
    updatedJob = job,
    updatedBaseIncome = baseSalary,
    updatedBaseExpenses = baseExpenses,
    updatedBaseSavings = baseSavings
  ) => {
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      // Отправляем обновленный профиль на бэкенд
      await axios.put(`${backendBaseUrl}/api/users/profile`, {
        job: updatedJob,
        country: "Moldova", // дефолт
        savings: updatedBaseSavings,
        income: updatedBaseIncome,
        expenses: updatedBaseExpenses
      }, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      // Перезагружаем интерфейс из БД
      loadUserDataFromDatabase();

    } catch (e) {
      console.error("Failed to sync metrics with server:", e);
    }

    // Сохраняем в локальный кэш
    const payload = {
      nickname: updatedNickname,
      username: updatedNickname,
      job: updatedJob,
      income: finalIncome, 
      expenses: finalExpenses, 
      savings: finalSavings, 
      baseIncome: updatedBaseIncome,
      baseExpenses: updatedBaseExpenses,
      baseSavings: updatedBaseSavings,
      goals: updatedGoals,
      transactions: updatedTransactions,
    };
    localStorage.setItem("finora_user_data", JSON.stringify(payload));
    
    setGoals(updatedGoals);
    setTransactions(updatedTransactions);
    setUsername(updatedNickname.toUpperCase());
    setJob(updatedJob);
    setBaseSalary(updatedBaseIncome);
    setBaseExpenses(updatedBaseExpenses);
    setBaseSavings(updatedBaseSavings);

    localStorage.removeItem("finora_ai_copilot_cache");
  };

  // Метод выхода из учетной записи
  const handleLogout = () => {
    localStorage.removeItem("finora_auth_token");
    localStorage.removeItem("finora_user_data");
    localStorage.removeItem("finora_ai_copilot_cache");
    localStorage.removeItem("finora_cache_market");
    router.push("/verification");
  };

  // Навигация к ИИ-подбору вариантов (999.md) конкретной цели
  const handleNavigateToGoalVariants = (goal) => {
    const savedData = localStorage.getItem("finora_user_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        parsed.goalName = goal.name;
        parsed.goalTargetAmount = goal.target;
        parsed.savings = goal.saved;
        localStorage.setItem("finora_user_data", JSON.stringify(parsed));
      } catch (e) { console.error(e); }
    }
    router.push(`/profile/goal-details?goalId=${goal.id}`);
  };

  // Метод сохранения биометрии и базовых лимитов
  const handleSaveProfileMeta = (e) => {
    e.preventDefault();
    saveAllToDatabase(
      goals,
      transactions,
      profileForm.nickname,
      profileForm.job,
      Number(profileForm.income) || 0,
      Number(profileForm.expenses) || 0,
      Number(profileForm.savings) || 0
    );
    setActiveModal(null);
  };

  // === ЭНДПОИНТЫ ТРАНЗАКЦИЙ (POST / PUT / DELETE) ===

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const newTx = {
      type: transactionForm.type,
      category: transactionForm.category.trim() || (transactionForm.type === "income" ? "Прочие доходы" : "Разные расходы"),
      amount: Number(transactionForm.amount) || 0,
      date: new Date().toLocaleDateString("ru-RU", {
        day: "numeric", month: "numeric", year: "numeric",
      }),
    };

    try {
      await axios.post(`${backendBaseUrl}/api/users/details/transactions`, newTx, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }

    setActiveModal(null);
  };

  const openEditTransactionModal = (tx) => {
    setSelectedTxId(tx.id);
    setTransactionForm({
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      date: tx.date
    });
    setActiveModal("edit_transaction");
  };

  const handleSaveEditedTransaction = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      await axios.put(`${backendBaseUrl}/api/users/details/transactions/${selectedTxId}`, {
        type: transactionForm.type,
        category: transactionForm.category,
        amount: Number(transactionForm.amount) || 0,
        date: transactionForm.date
      }, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }

    setSelectedTxId(null);
    setActiveModal(null);
  };

  const handleDeleteTransaction = async (id) => {
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      await axios.delete(`${backendBaseUrl}/api/users/details/transactions/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // === ЭНДПОИНТЫ ЦЕЛЕЙ (POST / PUT / DELETE) ===

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const targetVal = Number(goalForm.target) || 1000;
    const savedVal = Math.min(Number(goalForm.saved) || 0, targetVal);

    const newGoal = {
      name: goalForm.name.trim() || "Новая финансовая цель",
      target: targetVal,
      saved: savedVal,
    };

    try {
      await axios.post(`${backendBaseUrl}/api/users/details/goals`, newGoal, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }

    setActiveModal(null);
  };

  const openEditGoalModal = (goal) => {
    setSelectedGoalId(goal.id);
    setGoalForm({
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
    });
    setActiveModal("edit_goal");
  };

  const handleSaveEditedGoal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const targetVal = Number(goalForm.target) || 0;
    const savedVal = Math.min(Number(goalForm.saved) || 0, targetVal);

    try {
      await axios.put(`${backendBaseUrl}/api/users/details/goals/${selectedGoalId}`, {
        name: goalForm.name,
        target: targetVal,
        saved: savedVal,
      }, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }

    setSelectedGoalId(null);
    setActiveModal(null);
  };

  const handleAddFundsToGoal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const targetGoal = goals.find(g => g.id === selectedGoalId);
    if (!targetGoal) return;

    const addedAmount = Number(fundsAmount) || 0;
    const finalSaved = Math.min(targetGoal.saved + addedAmount, targetGoal.target);

    try {
      await axios.put(`${backendBaseUrl}/api/users/details/goals/${selectedGoalId}`, {
        name: targetGoal.name,
        target: targetGoal.target,
        saved: finalSaved,
      }, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }

    setFundsAmount("");
    setSelectedGoalId(null);
    setActiveModal(null);
  };

  const handleDeleteGoal = async (id) => {
    const token = localStorage.getItem("finora_auth_token");
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      await axios.delete(`${backendBaseUrl}/api/users/details/goals/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      loadUserDataFromDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/44 z-[1]" />

      {/* === MASTER_MODAL_STATION === */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            {/* 1. Единый редактор профиля */}
            {activeModal === "profile" && (
              <motion.form
                onSubmit={handleSaveProfileMeta}
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-lg w-full relative font-mono text-xs space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow-500">// USER_BIOMETRY_EDIT_STATION</span>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-gray-500">[ X ]</button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-500 block mb-1">ИМЯ ПОЛЬЗОВАТЕЛЯ:</label>
                    <input
                      type="text" required value={profileForm.nickname || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">СФЕРА ДЕЯТЕЛЬНОСТИ:</label>
                    <input
                      type="text" required value={profileForm.job || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, job: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">БАЗОВЫЙ ДОХОД ($):</label>
                    <input
                      type="number" required min="0" value={profileForm.income || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, income: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">БАЗОВЫЕ РАСХОДЫ ($):</label>
                    <input
                      type="number" required min="0" value={profileForm.expenses || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, expenses: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 block mb-1">БАЗОВЫЕ НАКОПЛЕНИЯ ($):</label>
                    <input
                      type="number" required min="0" value={profileForm.savings || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, savings: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400">
                  Сохранить Изменения
                </button>
              </motion.form>
            )}

            {/* 2. Модальное окно добавления транзакции */}
            {activeModal === "add_transaction" && (
              <motion.form
                onSubmit={handleAddTransaction}
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-md w-full relative font-mono text-xs space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow-500">// INJECT_FINANCIAL_TRANSACTION</span>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-gray-500">[ X ]</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 block mb-1">ТИП ОПЕРАЦИИ:</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    >
                      <option value="income">Поступление (Доход)</option>
                      <option value="outcome">Списание (Расход)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">КАТЕГОРИЯ / НАИМЕНОВАНИЕ:</label>
                    <input
                      type="text" required value={transactionForm.category || ""}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                      placeholder="Например: Бонус, Фриланс, Аренда, Кафе..."
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">СУММА ОПЕРАЦИИ ($):</label>
                    <input
                      type="number" required min="1" value={transactionForm.amount || ""}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      placeholder="Сумма в долларах"
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400">
                  Записать Транзакцию
                </button>
              </motion.form>
            )}

            {/* 2.1 Модальное окно РЕДАКТИРОВАНИЯ транзакции */}
            {activeModal === "edit_transaction" && (
              <motion.form
                onSubmit={handleSaveEditedTransaction}
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-md w-full relative font-mono text-xs space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow-500">// EDIT_FINANCIAL_TRANSACTION</span>
                  <button type="button" onClick={() => { setActiveModal(null); setSelectedTxId(null); }} className="text-gray-500">[ X ]</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 block mb-1">ТИП ОПЕРАЦИИ:</label>
                    <select
                      value={transactionForm.type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    >
                      <option value="income">Поступление (Доход)</option>
                      <option value="outcome">Списание (Расход)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">КАТЕГОРИЯ:</label>
                    <input
                      type="text" required value={transactionForm.category || ""}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">СУММА ($):</label>
                    <input
                      type="number" required min="1" value={transactionForm.amount || ""}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400">
                  Сохранить Изменения
                </button>
              </motion.form>
            )}

            {/* 3. Модальное окно создания новой цели */}
            {activeModal === "add_goal" && (
              <motion.form
                onSubmit={handleAddGoal}
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-md w-full relative font-mono text-xs space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow-500">// INITIALIZE_NEW_OBJECTIVE</span>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-gray-500">[ X ]</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 block mb-1">ИМЯ ЦЕЛИ (НА ЧТО КОПИМ):</label>
                    <input
                      type="text" required value={goalForm.name || ""}
                      onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                      placeholder="Например: Поездка в Рим, iPhone 17"
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">ЦЕЛЕВАЯ СУММА НАКОПЛЕНИЯ ($):</label>
                    <input
                      type="number" required min="1" value={goalForm.target || ""}
                      onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">СТАРТОВЫЙ ДЕПОЗИТ В ЦЕЛЬ ($):</label>
                    <input
                      type="number" required min="0" value={goalForm.saved || ""}
                      onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })}
                      placeholder="Сколько уже отложено именно на эту цель"
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400">
                  Активировать Цель
                </button>
              </motion.form>
            )}

            {/* 4. Модальное окно РЕДАКТИРОВАНИЯ ЦЕЛИ */}
            {activeModal === "edit_goal" && (
              <motion.form
                onSubmit={handleSaveEditedGoal}
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-md w-full relative font-mono text-xs space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow-500">// EDIT_EXISTING_OBJECTIVE</span>
                  <button type="button" onClick={() => { setActiveModal(null); setSelectedGoalId(null); }} className="text-gray-500">[ X ]</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 block mb-1">НАЗВАНИЕ ЦЕЛИ:</label>
                    <input
                      type="text" required value={goalForm.name || ""}
                      onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">ЦЕЛЕВАЯ СУММА НАКОПЛЕНИЯ ($):</label>
                    <input
                      type="number" required min="1" value={goalForm.target || ""}
                      onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">ТЕКУЩИЙ БЮДЖЕТ НАКОПЛЕНИЙ ($):</label>
                    <input
                      type="number" required min="0" value={goalForm.saved || ""}
                      onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400">
                  Сохранить Изменения Цели
                </button>
              </motion.form>
            )}

            {/* 5. Модальное окно пополнения баланса цели (+DEPOSIT) */}
            {activeModal === "add_funds" && (
              <motion.form
                onSubmit={handleAddFundsToGoal}
                initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
                className="border border-yellow-500 bg-[#0e0f13] p-6 max-sm w-1/4 relative font-mono text-xs space-y-4"
              >
                <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-yellow-500">// QUICK_DEPOSIT_FUNDS</span>
                  <button type="button" onClick={() => { setActiveModal(null); setSelectedGoalId(null); }} className="text-gray-500">[ X ]</button>
                </div>
                <div>
                  <label className="text-gray-500 block mb-2">ПОПОЛНИТЬ БАЛАНС ЦЕЛИ НА СУММУ ($):</label>
                  <input
                    type="number" required min="1" value={fundsAmount || ""}
                    onChange={(e) => setFundsAmount(e.target.value)}
                    placeholder="Сумма депозита"
                    className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400">
                  Зачислить Депозит
                </button>
              </motion.form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl w-full mx-auto space-y-8 my-auto">
        {/* Шапка Кабинета */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
          <div>
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-yellow-500/80 block mb-1">
              [ synapse_profile_control // node_id ]
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">
              {username}'S PORTFOLIO PROFILE
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-1">
              КОНТРОЛЬ И СИНХРОНИЗАЦИЯ ЛИМИТОВ БЮДЖЕТНОЙ СЕТИ
            </p>
          </div>
          <div className="flex gap-3">
            {/* КНОПКА ВЫХОДА ИЗ УЧЕТНОЙ ЗАПИСИ (LOGOUT) */}
            <button 
              onClick={handleLogout}
              className="group relative overflow-hidden border border-rose-500/20 bg-rose-500/5 px-6 py-3 font-mono tracking-widest text-[11px] uppercase text-rose-400 hover:text-white transition-colors duration-300"
            >
              <span className="relative z-10">Выйти</span>
              <div className="absolute bottom-0 left-0 h-full w-full bg-rose-500 origin-bottom scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100 z-0" />
            </button>
            <Link href="/dashboard">
              <button className="group relative overflow-hidden border border-white/20 px-6 py-3 font-mono tracking-widest text-[11px] uppercase text-gray-400 hover:text-black transition-colors duration-300">
                <span className="relative z-10">Назад на Дашборд</span>
                <div className="absolute bottom-0 left-0 h-full w-full bg-white origin-bottom scale-y-0 transition-transform duration-300 ease-out group-hover:scale-y-100 z-0" />
              </button>
            </Link>
          </div>
        </header>

        {/* СЕТКА ДАШБОРДА ПРОФИЛЯ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* СЕКЦИЯ 1: СПЕЦИФИКАЦИИ ПРОФИЛЯ */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* Бюджетная метрика */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h2 className="text-xs text-yellow-500 uppercase tracking-widest mb-6">
                [ USER_SPECIFICATIONS ]
              </h2>

              <div className="space-y-4 text-xs md:text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">ПСЕВДОНИМ:</span>
                  <span className="text-white font-bold">{username}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">МЕСТО РАБОТЫ:</span>
                  <span className="text-white truncate max-w-[150px]">
                    {job}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">МЕСЯЧНЫЙ ДОХОД (TOTAL):</span>
                  <span className="text-emerald-400 font-bold">
                    ${(finalIncome || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">МЕСЯЧНЫЕ РАСХОДЫ (TOTAL):</span>
                  <span className="text-rose-400 font-bold">
                    ${(finalExpenses || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">ТАКТИЧЕСКИЙ ПРОФИЦИТ:</span>
                  <span className="text-white font-bold">
                    ${(calculatedSurplus || 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>ЭФФЕКТИВНОСТЬ БЮДЖЕТА:</span>
                    <span>{efficiencyRate}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-emerald-400"
                      style={{ width: `${Math.min(100, efficiencyRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-6">
                <button
                  onClick={() => setActiveModal("profile")}
                  className="py-2 border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wider"
                >
                  [ EDIT_PROFILE ]
                </button>
                <button
                  onClick={() => setActiveModal("add_transaction")}
                  className="py-2 border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wider"
                >
                  [ + TRACK_TX ]
                </button>
              </div>
            </div>

            {/* Менеджер Истории Оптимизации Бюджета */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h2 className="text-xs text-yellow-500 uppercase tracking-widest mb-4">
                [ TRANSACTION_HISTORY_LOG ]
              </h2>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar text-[11px]">
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex justify-between items-center p-2 bg-black/40 border border-white/5"
                    >
                      <div className="truncate pr-2">
                        <span className="text-[9px] text-gray-500 block uppercase">
                          {t.date} // {t.category}
                        </span>
                        <span className={`font-bold uppercase ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                          {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {/* КНОПКА ИЗМЕНЕНИЯ ТРАНЗАКЦИИ */}
                        <button 
                          onClick={() => openEditTransactionModal(t)}
                          className="text-[9px] text-yellow-500/50 hover:text-yellow-400 border border-yellow-500/10 hover:border-yellow-500/30 px-1.5 py-0.5"
                        >
                          [ EDIT ]
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-[9px] text-rose-500/50 hover:text-rose-400 border border-rose-500/10 hover:border-rose-500/30 px-1.5 py-0.5"
                        >
                          [ DEL ]
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    [ ИСТОРИЯ ТРАНЗАКЦИЙ ПУСТА ]
                  </div>
                )}
              </div>
            </div>

            {/* ИСПРАВЛЕНО: Навигатор шлюзов с прямой и видимой кнопкой к ИИ-советам */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono space-y-4">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
              <h2 className="text-xs text-yellow-500 uppercase tracking-widest mb-4">
                [ SYSTEM_NAVIGATION_ROUTER ]
              </h2>
              <div className="space-y-2">
                <Link href="/investments" className="block w-full">
                  <button className="w-full p-3 text-left border border-white/10 bg-black/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-xs font-bold text-gray-300 hover:text-emerald-400">
                    [ 01_INVESTMENTS_HUB ] ➔
                  </button>
                </Link>
                <Link href="/profile/advices" className="block w-full">
                  <button className="w-full p-3 text-left border border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all text-xs font-bold text-yellow-500 hover:text-white">
                    [ 02_AI_ADVICES_MATRIX ] ➔
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* СЕКЦИЯ 2: МНОЖЕСТВЕННЫЙ МЕНЕДЖЕР ЦЕЛЕЙ */}
          <section className="lg:col-span-8 space-y-6">
            {pinnedAdvice && (
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-6 rounded-none relative font-mono text-xs space-y-3">
                <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 text-[10px] block uppercase tracking-widest">// PINNED_STRATEGIC_ADVICE</span>
                  <div className="flex gap-2">
                    <Link href="/profile/advices" className="text-[9px] text-emerald-400 hover:underline">
                      [ ПОЛНЫЙ ОБЗОР ]
                    </Link>
                    <button 
                      onClick={() => {
                        localStorage.removeItem("finora_pinned_advice");
                        setPinnedAdvice(null);
                      }}
                      className="text-[9px] text-gray-500 hover:text-white"
                    >
                      [ ОЧИСТИТЬ ]
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 italic leading-relaxed">
                  "{pinnedAdvice}"
                </p>
              </div>
            )}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono">
              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />

              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                <h2 className="text-xs text-yellow-500 uppercase tracking-widest">
                  [ COGNITIVE_GOALS_MANAGER ]
                </h2>
                <button
                  onClick={() => setActiveModal("add_goal")}
                  className="text-[10px] text-yellow-500 border border-yellow-500/30 hover:border-yellow-500 bg-yellow-500/5 px-3 py-1 font-bold uppercase"
                >
                  [ + NEW_OBJECTIVE ]
                </button>
              </div>

              {goals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {goals.map((goal, idx) => {
                    const isCompleted = goal.target > 0 && goal.saved >= goal.target;
                    const percent =
                      goal.target > 0
                        ? Math.round((goal.saved / goal.target) * 100)
                        : 0;
                    return (
                      <div
                        key={goal.id}
                        className={`border p-4 space-y-3 relative group transition-all duration-300 ${
                          isCompleted 
                            ? "border-emerald-500 bg-emerald-950/10 shadow-lg shadow-emerald-500/5" 
                            : "border-white/5 bg-black/40"
                        }`}
                      >
                        <div className={`absolute top-0 right-0 w-1.5 h-1.5 ${isCompleted ? "bg-emerald-500" : "bg-yellow-500"}`} />
                        <div className="flex justify-between items-start border-b border-white/5 pb-2">
                          <div>
                            <span className="text-[9px] text-gray-500 block uppercase">
                              // OBJECTIVE_0{idx + 1}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`text-xs font-bold uppercase tracking-widest ${isCompleted ? "text-emerald-400" : "text-white"}`}>
                                {goal.name}
                              </span>
                              {isCompleted && (
                                <span className="text-[8px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-bold tracking-wider">
                                  [ ✓ ВЫПОЛНЕНО ]
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-[9px] text-rose-500/50 hover:text-rose-400 px-1 border border-rose-500/5 hover:border-rose-500/20"
                          >
                            [ DEL ]
                          </button>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Накоплено:</span>
                            <span className="text-white font-bold">
                              ${goal.saved.toLocaleString()} / $
                              {goal.target.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Прогресс:</span>
                            <span className={isCompleted ? "text-emerald-400 font-bold" : "text-yellow-500"}>
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-white/10 relative overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-yellow-500"}`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                          <button
                            disabled={isCompleted}
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                              setActiveModal("add_funds");
                            }}
                            className={`text-[9px] border px-2 py-1 w-full text-center transition-colors ${
                              isCompleted 
                                ? "border-white/5 text-gray-600 cursor-not-allowed bg-transparent" 
                                : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:text-white"
                            }`}
                          >
                            [ + DEPOSIT ]
                          </button>
                          
                          {/* Кнопка быстрого изменения целей */}
                          <button
                            onClick={() => openEditGoalModal(goal)}
                            className="text-[9px] border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 hover:text-white px-2 py-1 w-full text-center"
                          >
                            [ EDIT ]
                          </button>

                          <button
                            onClick={() => handleNavigateToGoalVariants(goal)}
                            className="text-[9px] border border-white/10 bg-white/5 text-gray-400 hover:text-white px-2 py-1 w-full text-center"
                          >
                            [ VARIANTS ↗ ]
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  // Активные цели отсутствуют. Инициализируйте новую цель
                  кнопкой выше.
                </div>
              )}
            </div>
            
            {/* Глобальная метрика общих накоплений в USD */}
            <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative font-mono text-xs space-y-3">
              <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500" />
              <span className="text-yellow-500 text-[10px] block uppercase tracking-widest">// CUMULATIVE_SAVINGS_METRICS</span>
              <div className="flex justify-between">
                <span className="text-gray-400">БАЗОВЫЙ СТАРТОВЫЙ РЕЗЕРВ:</span>
                <span className="text-white font-bold">${baseSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">НАКОПЛЕНО ТРАНЗАКЦИЯМИ (NET):</span>
                <span className={`${netTxSavings >= 0 ? "text-emerald-400" : "text-rose-400"} font-bold`}>
                  {netTxSavings >= 0 ? "+" : "-"}${Math.abs(netTxSavings).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">АККУМУЛИРОВАНО ПО ВСЕМ ЦЕЛЯМ:</span>
                <span className="text-emerald-400 font-bold">+${goalsSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5 text-sm">
                <span className="text-gray-400 font-bold">ОБЩИЙ ОБЪЕМ СБЕРЕЖЕНИЙ (TOTAL):</span>
                <span className="text-yellow-500 font-black">${finalSavings.toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Подвал кабинета */}
      <footer className="relative z-10 flex justify-between items-center border-t border-white/5 pt-4 font-mono text-[10px] text-gray-600 mt-6">
        <div>SECURE CLIENT_ID: SHA-{username}-256</div>
        <div>FINORA CORE v1.0.8</div>
      </footer>
    </div>
  );
}