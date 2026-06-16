"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function VerificationPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);

  // Стейты авторизации
  const [selectedProfile, setSelectedProfile] = useState(null); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Стейты ручного ввода
  const [manualUsername, setManualUsername] = useState("");
  const [manualPassword, setManualPassword] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const savedActive = localStorage.getItem("finora_user_data");
    const savedList = localStorage.getItem("finora_profiles");

    let list = [];
    if (savedList) {
      try {
        list = JSON.parse(savedList);
      } catch (e) {
        console.error("Failed to parse profile list", e);
      }
    }

    let active = null;
    if (savedActive) {
      try {
        active = JSON.parse(savedActive);
        const exists = list.some(
          (p) => p.nickname?.toLowerCase() === active.nickname?.toLowerCase()
        );
        if (!exists && active.nickname) {
          list.push(active);
          localStorage.setItem("finora_profiles", JSON.stringify(list));
        }
      } catch (e) {
        console.error("Failed to parse active user", e);
      }
    }

    setProfiles(list);
    setActiveProfile(active);
  }, []);

  const handleSelectProfileClick = (profile) => {
    setSelectedProfile(profile);
    setPassword("");
    setAuthError(null);
  };

  // Метод сохранения сессии в список сохраненных на ПК
  const saveProfileToSwitcherList = (profileData) => {
    const newProfile = {
      nickname: profileData.username,
      job: profileData.job,
      income: profileData.lunaryIncome || profileData.income || 0,
      expenses: profileData.lunaryOutcome || profileData.expenses || 0,
      savings: profileData.savings || 0
    };

    localStorage.setItem("finora_user_data", JSON.stringify(newProfile));

    const savedList = localStorage.getItem("finora_profiles");
    let list = savedList ? JSON.parse(savedList) : [];
    const exists = list.some(p => p.nickname?.toLowerCase() === newProfile.nickname?.toLowerCase());
    
    if (!exists) {
      list.push(newProfile);
      localStorage.setItem("finora_profiles", JSON.stringify(list));
    }
    return newProfile;
  };

  // ИСПРАВЛЕНО: Единый метод для обработки успешного входа
  const handleSuccessLogin = (token, profileData) => {
    localStorage.setItem("finora_auth_token", token);
    localStorage.setItem("finora_user_data", JSON.stringify(profileData));
    
    // Устанавливаем флаг перехода в sessionStorage
    sessionStorage.setItem("finora_from_verification", "true");
    
    // Перенаправляем на дашборд с query-параметром
    router.push("/dashboard?from=verification");
  };

  // Авторизация по клику на сохраненную карточку
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      const response = await axios.post(`${backendBaseUrl}/api/auth/login`, {
        username: selectedProfile.nickname,
        password: password,
      }, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("RAW_SERVER_RESPONSE_DATA:", response.data);

      const token = 
        response.data?.token || 
        response.data?.accessToken || 
        response.data?.jwt || 
        response.data?.jwtToken;

      if (token) {
        // ИСПРАВЛЕНО: Вызываем общий обработчик успешного входа вместо прямого перехода
        handleSuccessLogin(token, selectedProfile);
        setSelectedProfile(null);
      } else {
        console.error("Token key not found in response. Received keys:", Object.keys(response.data || {}));
        throw new Error("Неверный формат ответа авторизации. Токен отсутствует в теле ответа.");
      }

    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || err.message;
      setAuthError(serverMessage || "Неверный пароль.");
    } finally {
      setLoading(false);
    }
  };

  // Метод ручного входа с автодобавлением в список сохраненных аккаунтов
  const handleManualLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      const loginRes = await axios.post(`${backendBaseUrl}/api/auth/login`, {
        username: manualUsername,
        password: manualPassword,
      }, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("MANUAL_LOGIN_RAW_RESPONSE_DATA:", loginRes.data);

      const token = 
        loginRes.data?.token || 
        loginRes.data?.accessToken || 
        loginRes.data?.jwt || 
        loginRes.data?.jwtToken;

      if (!token) {
        throw new Error("Авторизация отклонена: отсутствует токен безопасности.");
      }

      // Делаем мгновенный запрос профиля пользователя для сохранения сессии
      const profileRes = await axios.get(`${backendBaseUrl}/api/users/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const savedProfile = saveProfileToSwitcherList(profileRes.data);
      
      // ИСПРАВЛЕНО: Вызываем общий обработчик успешного входа для ручной авторизации
      handleSuccessLogin(token, savedProfile);

    } catch (err) {
      console.error("Manual handshake failed:", err);
      const serverMessage = err.response?.data?.message || err.message;
      setAuthError(serverMessage || "Ошибка авторизации или неверные данные.");
    } finally {
      setLoading(false);
    }
  };

  const leftCard = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  const rightCard = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  return (
    <main className="relative min-h-screen w-full bg-transparent overflow-hidden text-white flex flex-col justify-between p-6 md:p-12">
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* === MODAL: ВВОД ПАРОЛЯ ДЛЯ СОХРАНЕННОГО ПРОФИЛЯ === */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.form 
              onSubmit={handleLoginSubmit}
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="border border-yellow-500 bg-[#0e0f13] p-6 max-w-sm w-full relative font-mono text-xs space-y-4"
            >
              <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500" />
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <span className="text-yellow-500 text-[9px] block">// ESTABLISHING_HANDSHAKE</span>
                  <h3 className="text-sm font-bold uppercase text-white mt-1">Вход: {selectedProfile.nickname.toUpperCase()}</h3>
                </div>
                <button type="button" onClick={() => setSelectedProfile(null)} className="text-gray-500">[ X ]</button>
              </div>

              <div className="space-y-3">
                <label className="text-gray-500 block">ВВЕДИТЕ ПАРОЛЬ БЕЗОПАСНОСТИ:</label>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 p-2.5 text-white outline-none focus:border-yellow-500"
                />
              </div>

              {authError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px]">
                  {`>>> AUTH_ERROR: ${authError}`}
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {loading ? "Авторизация..." : "Установить Соединение"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 flex justify-between items-center border-b border-white/5 pb-4 font-mono text-xs text-gray-500">
        <div>
          <span className="text-yellow-500 font-bold">// FINORA_AI</span> — IDENTITY ROUTER
        </div>
        <div className="flex items-center gap-2">
          SAVED NODES:{" "}
          <span className="text-yellow-500 font-mono tracking-widest font-bold">
            [{profiles.length}] ACTIVE
          </span>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-7xl w-full mx-auto my-auto items-stretch">
        {/* ЛЕВАЯ КОЛОНКА: ВЫБОР ИЗ СОХРАНЕННЫХ */}
        <motion.section
          variants={leftCard} initial="hidden" animate="visible"
          className="border border-white/10 bg-black/30 backdrop-blur-md p-8 rounded-none relative flex flex-col justify-between min-h-[440px]"
        >          
          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
          
          <div className="space-y-6 w-full">
            <div className="font-mono text-xs text-yellow-500 uppercase tracking-widest">
              [ 01_SYNAPSE_NODES // ВЫБОР ПРОФИЛЯ ]
            </div>
            
            <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight">
              Мы уже знакомы?
            </h2>
            <p className="text-xs text-gray-400 font-mono leading-relaxed max-w-md">
              Выберите сохраненный профиль из локальной памяти этого устройства, чтобы авторизоваться в системе с помощью пароля.
            </p>

            <div className="space-y-3 mt-6 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {profiles.length > 0 ? (
                profiles.map((profile, idx) => {
                  const isActive = activeProfile?.nickname === profile.nickname;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectProfileClick(profile)} 
                      className={`w-full p-4 text-left border font-mono transition-all duration-300 flex justify-between items-center relative group ${
                        isActive
                          ? "border-yellow-500 bg-yellow-500/5 text-white"
                          : "border-white/10 bg-black/20 text-gray-400 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      <div className="truncate pr-4">
                        <span className="text-xs text-gray-500 block mb-0.5">
                          // NODE_0{idx + 1} {isActive && "[CURRENT_ACTIVE]"}
                        </span>
                        <span className="text-sm font-bold text-white uppercase tracking-widest">
                          {profile.nickname || "UNNAMED"}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-1 truncate">
                          Occupation: {profile.job || "Not selected"}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="border border-white/5 bg-black/40 p-6 text-center font-mono text-xs text-gray-500">
                  [ ПАМЯТЬ ДЕШИФРАТОРА ПУСТА ]
                  <span className="block mt-2 text-[10px] opacity-70">
                    Активные профили на этом устройстве не найдены.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[9px] text-gray-600 font-mono uppercase mt-6 pt-4 border-t border-white/5">
            // LOCAL_SYNAPSE_TELEMETRY: ENCRYPTED // SELECT PORT TO INITIALIZE DASHBOARD
          </div>
        </motion.section>

        {/* ПРАВАЯ КОЛОНКА: РУЧНОЙ ВХОД И НОВОЕ ЗНАКОМСТВО */}
        <motion.section
          variants={rightCard} initial="hidden" animate="visible"
          className="border border-white/10 bg-black/30 backdrop-blur-md p-8 rounded-none relative flex flex-col justify-between min-h-[440px]"
        >       
          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
          
          <div className="space-y-6 w-full">
            <div className="font-mono text-xs text-yellow-500 uppercase tracking-widest">
              [ 02_COGNITIVE_CYCLE // РУЧНОЙ ВХОД ]
            </div>

            <form onSubmit={handleManualLoginSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">USERNAME:</label>
                  <input 
                    type="text" required value={manualUsername || ""}
                    onChange={(e) => setManualUsername(e.target.value)}
                    placeholder="Ваш логин..."
                    className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">PASSWORD:</label>
                  <input 
                    type="password" required value={manualPassword || ""}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 p-2 text-white outline-none focus:border-yellow-500 font-mono text-xs"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-2 border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 text-yellow-500 text-xs uppercase font-mono tracking-wider transition-all"
              >
                {loading ? "Установление связи..." : "[ LOGIN_EXISTING_NODE ]"}
              </button>
            </form>

            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] text-gray-500 font-mono block uppercase mb-2">// ИЛИ СОЗДАЙТЕ НОВУЮ НОДУ</span>
              <Link href="/info">
                <button className="group relative overflow-hidden border border-white/10 px-8 py-3 font-mono tracking-widest text-xs uppercase text-gray-300 hover:text-black transition-colors duration-500 shadow-[0_0_40px_rgba(255,255,255,0.02)] w-full">
                  <span className="relative z-10">Инициировать знакомство →</span>
                  <div className="absolute bottom-0 left-0 h-full w-full bg-white origin-bottom scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100 z-0" />
                </button>
              </Link>
            </div>
          </div>

          <div className="text-[9px] text-gray-600 font-mono uppercase pt-4 border-t border-white/5">
            // NEXT_NEURAL_VECTOR_GENERATOR: READY // INITIALIZING HANDSHAKE WIZARD
          </div>
        </motion.section>
      </div>

      <footer className="relative z-10 flex justify-between items-center border-t border-white/5 pt-4 font-mono text-[10px] text-gray-600">
        <div>ROUTING_KEY: LOCAL_IDENTITY_DECISION</div>
        <div>FINORA CORE v1.0.8</div>
      </footer>
    </main>
  );
}