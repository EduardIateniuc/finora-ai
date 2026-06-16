"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TypicalButton from "../components/typicalButton";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function InfoPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [animate, setAnimate] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Серверные ошибки регистрации
  const [stepError, setStepError] = useState(null); // Ошибки валидации

  // Стейты асинхронных проверок уникальности в СУБД
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameExistsError, setUsernameExistsError] = useState(null);

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState(null);

  // Инициализация формы
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    country: "",
    job: "",
    savings: "",
    income: "",
    expenses: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Сохраняем черновик в localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("finora_user_data", JSON.stringify(formData));
    }
  }, [formData, isMounted]);

  useEffect(() => {
    setAnimate(true);
  }, [step]);

  // Валидаторы локальной структуры «на лету»
  const isNicknameValid = (val) => {
    const trimmed = val.trim();
    return (
      trimmed.length >= 3 &&
      trimmed.length <= 20 &&
      /^[a-zA-Zа-яА-Я0-9_\s-]+$/.test(val)
    );
  };

  const isEmailValid = (val) => {
    const trimmed = val.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      trimmed.length > 0 &&
      trimmed.length <= 50 &&
      emailRegex.test(trimmed) &&
      !/\s/.test(val)
    );
  };

  const isPasswordValid = (val) => {
    return val.length >= 8 && /[a-zA-Zа-яА-Я]/.test(val) && /\d/.test(val);
  };

  const isCountryValid = (val) => {
    const trimmed = val.trim();
    return (
      trimmed.length >= 3 &&
      trimmed.length <= 30 &&
      /^[a-zA-Zа-яА-Я\s-]+$/.test(val)
    );
  };

  const isJobValid = (val) => {
    const trimmed = val.trim();
    return (
      trimmed.length >= 3 &&
      trimmed.length <= 50 &&
      /^[a-zA-Zа-яА-Я0-9\s-]+$/.test(val)
    );
  };

  const isIncomeValid = (val) => {
    if (val === "" || val === null) return false;
    const n = Number(val);
    return !isNaN(n) && n >= 0 && n <= 1000000;
  };

  const isExpensesValid = (val) => {
    if (val === "" || val === null) return false;
    const n = Number(val);
    return !isNaN(n) && n >= 0 && n <= 1000000;
  };

  const isSavingsValid = (val) => {
    if (val === "" || val === null) return false;
    const n = Number(val);
    return !isNaN(n) && n >= 0 && n <= 10000000;
  };

  // Дебаунс-проверка уникальности USERNAME в реальном времени
  useEffect(() => {
    if (!formData.nickname || !isNicknameValid(formData.nickname)) {
      setUsernameExistsError(null);
      return;
    }

    const checkTimeout = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const backendBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await axios.get(
          `${backendBaseUrl}/api/auth/check-username`,
          {
            params: { username: formData.nickname },
          },
        );
        if (response.data === true || response.data?.exists === true) {
          setUsernameExistsError(
            "Этот псевдоним уже занят в базе данных Finora.",
          );
        } else {
          setUsernameExistsError(null);
        }
      } catch (err) {
        console.error("Username validation check error", err);
      } finally {
        setUsernameChecking(false);
      }
    }, 600);

    return () => clearTimeout(checkTimeout);
  }, [formData.nickname]);

  // Дебаунс-проверка уникальности EMAIL в реальном времени
  useEffect(() => {
    if (!formData.email || !isEmailValid(formData.email)) {
      setEmailExistsError(null);
      return;
    }

    const checkTimeout = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const backendBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await axios.get(
          `${backendBaseUrl}/api/auth/check-email`,
          {
            params: { email: formData.email },
          },
        );
        if (response.data === true || response.data?.exists === true) {
          setEmailExistsError(
            "Пользователь с такой почтой уже зарегистрирован.",
          );
        } else {
          setEmailExistsError(null);
        }
      } catch (err) {
        console.error("Email validation check error", err);
      } finally {
        setEmailChecking(false);
      }
    }, 600);

    return () => clearTimeout(checkTimeout);
  }, [formData.email]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setStepError(null);

    if (field === "nickname") {
      setUsernameExistsError(null);
    }
    if (field === "email") {
      setEmailExistsError(null);
    }
  };

  // Валидация при клике на "Продолжить"
  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        if (usernameChecking)
          return "Выполняется проверка псевдонима. Пожалуйста, подождите...";
        if (usernameExistsError) return usernameExistsError;
        if (!formData.nickname.trim())
          return "Поле 'Имя' обязательно к заполнению.";
        if (
          formData.nickname.trim().length < 3 ||
          formData.nickname.trim().length > 20
        ) {
          return "Превышен или занижен лимит символов. Имя должно содержать от 3 до 20 символов.";
        }
        if (!/^[a-zA-Zа-яА-Я0-9_\s-]+$/.test(formData.nickname)) {
          return "Имя содержит запрещенные символы. Разрешены только буквы, цифры, дефис и пробел.";
        }
        break;
      case 2:
        if (emailChecking)
          return "Выполняется проверка адреса почты. Пожалуйста, подождите...";
        if (emailExistsError) return emailExistsError;
        if (!isEmailValid(formData.email)) {
          return "Пожалуйста, введите корректный адрес электронной почты (макс. 50 символов, без пробелов).";
        }
        if (!isPasswordValid(formData.password)) {
          return "Недостаточный уровень защиты пароля. Требуется не менее 8 символов, включая как буквы, так и цифры.";
        }
        break;
      case 3:
        if (!isCountryValid(formData.country)) {
          return "Некорректно указана страна. Название должно быть от 3 до 30 символов, содержать только буквы и дефис.";
        }
        break;
      case 4:
        if (!isJobValid(formData.job)) {
          return "Некорректно указана сфера деятельности. Лимит от 3 до 50 символов.";
        }
        break;
      case 5:
        if (!isIncomeValid(formData.income)) {
          return "Пожалуйста, введите корректный доход. Значение должно быть числом от $0 до $1,000,000.";
        }
        break;
      case 6:
        if (!isExpensesValid(formData.expenses)) {
          return "Пожалуйста, введите корректные расходы. Значение должно быть числом от $0 до $1,000,000.";
        }
        break;
      case 7:
        if (!isSavingsValid(formData.savings)) {
          return "Пожалуйста, введите корректные накопления. Значение должно быть числом от $0 до $10,000,000.";
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (usernameChecking || emailChecking || loading) {
      setStepError("Дождитесь завершения фоновой проверки безопасности...");
      return;
    }

    const errorMsg = validateStep(step);
    if (errorMsg) {
      setStepError(errorMsg);
      return;
    }

    setStepError(null);

    if (step < 8) {
      setAnimate(false);
      setTimeout(() => {
        setStep((s) => s + 1);
      }, 300);
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStepError(null);
      setAnimate(false);
      setTimeout(() => {
        setStep((s) => s - 1);
      }, 300);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    const backendBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    try {
      await axios.post(
        `${backendBaseUrl}/api/auth/register`,
        {
          username: formData.nickname,
          email: formData.email,
          password: formData.password,
          country: formData.country,
          job: formData.job,
          savings: Number(formData.savings) || 0,
          lunaryIncome: Number(formData.income) || 0,
          lunaryOutcome: Number(formData.expenses) || 0,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const loginRes = await axios.post(`${backendBaseUrl}/api/auth/login`, {
        username: formData.nickname,
        password: formData.password,
      });

      if (loginRes.data?.token) {
        localStorage.setItem("finora_auth_token", loginRes.data.token);

        const localProfile = {
          nickname: formData.nickname,
          job: formData.job,
          income: Number(formData.income) || 0,
          expenses: Number(formData.expenses) || 0,
          savings: Number(formData.savings) || 0,
        };
        localStorage.setItem("finora_user_data", JSON.stringify(localProfile));

        sessionStorage.setItem("finora_from_verification", "true");
        router.push("/dashboard?from=verification");
      }
    } catch (e) {
      console.error("Java API Connection Failed:", e);
      const serverMessage = e.response?.data || e.message;
      setError(serverMessage || "Ошибка соединения с сервером приложений.");
    } finally {
      setLoading(false);
    }
  };

  const numIncome = parseFloat(formData.income) || 0;
  const numExpenses = parseFloat(formData.expenses) || 0;
  const numSavings = parseFloat(formData.savings) || 0;
  const surplus = Math.max(0, numIncome - numExpenses);
  const savingsRate =
    numIncome > 0 ? Math.round((surplus / numIncome) * 100) : 0;

  const formatAmount = (value) => Number(value || 0).toLocaleString("en-US");

  const card = {
    hidden: { opacity: 0, x: 80 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.2,
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const showExpensesWarning =
    step === 6 && numExpenses > numIncome && numIncome > 0;

  // Рендеринг статуса валидации
  const renderStatusIndicator = (
    isValid,
    hasError,
    isChecking,
    label = "VERIFIED",
  ) => {
    if (isChecking) {
      return (
        <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 border text-yellow-500 border-yellow-500/30 bg-yellow-500/5 animate-pulse">
          [ CHECKING... ]
        </span>
      );
    }
    if (hasError) {
      return (
        <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 border text-rose-500 border-rose-500/30 bg-rose-500/5">
          [ BLOCKED ]
        </span>
      );
    }
    return (
      <span
        className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 border select-none transition-all duration-300 ${
          isValid
            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 animate-pulse"
            : "text-gray-500 border-white/10 bg-white/2"
        }`}
      >
        [ {isValid ? label : "AWAITING_INPUT"} ]
      </span>
    );
  };

  // Объединенный стейт ошибок
  const activeStepError =
    stepError ||
    (step === 1 ? usernameExistsError : step === 2 ? emailExistsError : null);

  const showEmailError =
    !!emailExistsError || (stepError && !isEmailValid(formData.email));
  const showPasswordError = stepError && !isPasswordValid(formData.password);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0e0f13]" />;
  }

  return (
    <main
      suppressHydrationWarning
      className="relative min-h-screen w-full bg-transparent overflow-hidden text-white flex flex-col justify-between p-6 md:p-12"
    >
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      <header className="relative z-10 flex justify-between items-center border-b border-white/5 pb-4 font-mono text-xs text-gray-500">
        <div>
          <span className="text-yellow-500 font-bold">// FINORA_AI</span> —
          ИНИЦИАЛИЗАЦИЯ ПРОФИЛЯ
        </div>
        <div className="hidden sm:block">
          СТАТУС:{" "}
          <span className="text-green-400 tracking-widest animate-pulse">
            ● СВЯЗЬ_АКТИВНА
          </span>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 my-auto items-center">
        {/* ЛЕВАЯ КОЛОНКА: СИСТЕМНЫЙ ДАШБОРД */}
        <motion.section
          variants={card}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 flex flex-col gap-6 font-mono select-none pointer-events-none"
        >
          <div className="border border-white/10 bg-black/20 backdrop-blur-md p-6 rounded-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500" />
            <span className="text-xs text-gray-500 uppercase tracking-widest block mb-4">
              [ АНАЛИТИКА В РЕАЛЬНОМ ВРЕМЕНИ ]
            </span>

            <div className="space-y-4 text-xs md:text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">ID_УЗЛА:</span>
                <span className="text-yellow-500 font-bold">
                  FN-
                  {formData.nickname
                    ? formData.nickname.substring(0, 3).toUpperCase()
                    : "TEMP"}
                  -99
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                {/* ИСПРАВЛЕНО: Классы тегов приведены к строгому значению text-gray-400 во всех сессиях компиляции */}
                <span className="text-gray-400">ПРОФЕССИЯ:</span>
                <span className="text-white truncate max-w-[150px]">
                  {formData.job || "НЕ_ОПРЕДЕЛЕНА"}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">МЕСЯЧНЫЙ ДОХОД:</span>
                <span className="text-emerald-400 font-semibold">
                  ${formatAmount(numIncome)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">ФИКСИРОВАННЫЕ РАСХОДЫ:</span>
                <span className="text-rose-400 font-semibold">
                  ${formatAmount(numExpenses)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">ОБЩИЕ НАКОПЛЕНИЯ:</span>
                <span className="text-yellow-500 font-semibold">
                  ${formatAmount(numSavings)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">МЕСЯЧНЫЙ ПРОФИЦИТ:</span>
                <span className="text-white font-bold">
                  ${formatAmount(surplus)}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>ЭФФЕКТИВНОСТЬ НАКОПЛЕНИЯ:</span>
                  <span>{savingsRate}%</span>
                </div>
                <div className="h-[3px] w-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, savingsRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-600 uppercase leading-relaxed max-w-xs hidden lg:block">
            // Этот терминал фиксирует вашу личную финансовую телеметрию для
            последующей генерации векторов ИИ.
          </div>
        </motion.section>

        {/* ПРАВАЯ КОЛОНКА: ВОПРОСЫ FINORA */}
        <motion.section
          className="lg:col-span-7 flex flex-col justify-center min-h-[380px]"
          variants={card}
          initial="hidden"
          animate="visible"
        >
          <form onSubmit={handleNext} className="space-y-8">
            <div className="font-mono text-xs text-yellow-500 uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-none">
                  ЭТАП_0{step}
                </span>
                <span>
                  / / {step === 8 ? "СВОДНЫЙ_АНАЛИЗ" : "ПРОЦЕСС_ЗНАКОМСТВА"}
                </span>
              </div>

              {step === 1 &&
                renderStatusIndicator(
                  isNicknameValid(formData.nickname),
                  !!usernameExistsError,
                  usernameChecking,
                )}
              {step === 2 &&
                renderStatusIndicator(
                  isEmailValid(formData.email) &&
                    isPasswordValid(formData.password),
                  !!emailExistsError,
                  emailChecking,
                )}
              {step === 3 &&
                renderStatusIndicator(
                  isCountryValid(formData.country),
                  false,
                  false,
                )}
              {step === 4 &&
                renderStatusIndicator(isJobValid(formData.job), false, false)}
              {step === 5 &&
                renderStatusIndicator(
                  isIncomeValid(formData.income),
                  false,
                  false,
                )}
              {step === 6 &&
                renderStatusIndicator(
                  isExpensesValid(formData.expenses),
                  false,
                  false,
                )}
              {step === 7 &&
                renderStatusIndicator(
                  isSavingsValid(formData.savings),
                  false,
                  false,
                )}
            </div>

            <div
              className={`transition-all duration-300 transform ${animate ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
            >
              {/* Шаг 1: Никнейм */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Инициализация системы успешно завершена. <br />Я —{" "}
                    <strong className="font-bold text-white">Finora</strong>.{" "}
                    <br />
                    Во-первых, как мне к тебе обращаться?"
                  </p>
                  <div className="relative mt-8 max-w-md">
                    <span className="absolute left-0 top-3 text-yellow-500 font-mono text-lg">{`>`}</span>
                    <input
                      type="text"
                      required
                      value={formData.nickname || ""}
                      onChange={(e) => handleChange("nickname", e.target.value)}
                      placeholder="Введи имя (от 3 до 20 символов)..."
                      className={`w-full bg-transparent border-b pb-2 pl-6 text-lg md:text-2xl text-white outline-none transition-colors ${
                        activeStepError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-white/20 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Шаг 2: Электронная почта и пароль */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Зададим параметры безопасности вашего профиля. <br />
                    Введите ваш{" "}
                    <strong className="text-white">электронный адрес</strong> и
                    надежный <strong className="text-white">пароль</strong>:"
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-xl">
                    <div className="relative">
                      <span className="absolute left-0 top-3 text-yellow-500 font-mono text-xs">
                        EMAIL:
                      </span>
                      <input
                        type="email"
                        required
                        value={formData.email || ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="your@email.com"
                        className={`w-full bg-transparent border-b pb-2 pl-14 text-sm text-white outline-none transition-colors ${
                          showEmailError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-white/20 focus:border-yellow-500"
                        }`}
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-0 top-3 text-yellow-500 font-mono text-xs">
                        PASSWORD:
                      </span>
                      <input
                        type="password"
                        required
                        value={formData.password || ""}
                        onChange={(e) =>
                          handleChange("password", e.target.value)
                        }
                        placeholder="мин. 8 знаков (буквы + цифры)"
                        className={`w-full bg-transparent border-b pb-2 pl-24 text-sm text-white outline-none transition-colors ${
                          showPasswordError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-white/20 focus:border-yellow-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Шаг 3: Страна */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Какова ваша экономическая геолокация? <br />
                    Укажите{" "}
                    <strong className="text-white">
                      страну вашего проживания
                    </strong>
                    :"
                  </p>
                  <div className="relative mt-8 max-w-md">
                    <span className="absolute left-0 top-3 text-yellow-500 font-mono text-lg">{`>`}</span>
                    <input
                      type="text"
                      required
                      value={formData.country || ""}
                      onChange={(e) => handleChange("country", e.target.value)}
                      placeholder="От 3 до 30 символов..."
                      className={`w-full bg-transparent border-b pb-2 pl-6 text-lg md:text-2xl text-white outline-none transition-colors ${
                        activeStepError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-white/20 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Шаг 4: Место работы */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Прекрасно. В какой сфере вы задействуете свои навыки?{" "}
                    <br />
                    Напишите вашу{" "}
                    <strong className="text-white">профессию</strong>:"
                  </p>
                  <div className="relative mt-8 max-w-md">
                    <span className="absolute left-0 top-3 text-yellow-500 font-mono text-lg">{`>`}</span>
                    <input
                      type="text"
                      required
                      value={formData.job || ""}
                      onChange={(e) => handleChange("job", e.target.value)}
                      placeholder="От 3 до 50 символов..."
                      className={`w-full bg-transparent border-b pb-2 pl-6 text-xl md:text-2xl text-white outline-none transition-colors ${
                        activeStepError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-white/20 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Шаг 5: Доходы */}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Теперь оцифруем ваши входящие денежные потоки. <br />
                    Каков ваш средний{" "}
                    <strong className="text-white">
                      ежемесячный доход ($)
                    </strong>
                    ?"
                  </p>
                  <div className="relative mt-8 max-w-md">
                    <span className="absolute left-0 top-3 text-yellow-500 font-mono text-lg">{`>`}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      max="1000000"
                      value={formData.income || ""}
                      onChange={(e) => handleChange("income", e.target.value)}
                      placeholder="Сумма в долларах (лимит до $1,000,000)"
                      className={`w-full bg-transparent border-b pb-2 pl-6 text-xl md:text-2xl text-white outline-none transition-colors ${
                        activeStepError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-white/20 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Шаг 6: Расходы */}
              {step === 6 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Сколько уходит на{" "}
                    <strong className="text-white">
                      обязательные и фиксированные расходы
                    </strong>{" "}
                    ежемесячно ($)?"
                  </p>
                  <div className="relative mt-8 max-w-md">
                    <span className="absolute left-0 top-3 text-yellow-500 font-mono text-lg">{`>`}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      max="1000000"
                      value={formData.expenses || ""}
                      onChange={(e) => handleChange("expenses", e.target.value)}
                      placeholder="Сумма в долларах (лимит до $1,000,000)"
                      className={`w-full bg-transparent border-b pb-2 pl-6 text-xl md:text-2xl text-white outline-none transition-colors ${
                        activeStepError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-white/20 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Шаг 7: Сбережения */}
              {step === 7 && (
                <div className="space-y-4">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Фиксация резервного базиса. <br />
                    Какую сумму{" "}
                    <strong className="text-white">накоплений</strong> вы уже
                    аккумулировали на текущий момент ($)?"
                  </p>
                  <div className="relative mt-8 max-w-md">
                    <span className="absolute left-0 top-3 text-yellow-500 font-mono text-lg">{`>`}</span>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10000000"
                      value={formData.savings || ""}
                      onChange={(e) => handleChange("savings", e.target.value)}
                      placeholder="Сумма в долларах (лимит до $10,000,000)"
                      className={`w-full bg-transparent border-b pb-2 pl-6 text-xl md:text-2xl text-white outline-none transition-colors ${
                        activeStepError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-white/20 focus:border-yellow-500"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Шаг 8: Сводка */}
              {step === 8 && (
                <div className="space-y-6 max-w-xl animate-pulse">
                  <p className="text-2xl md:text-4xl font-light text-gray-300 leading-snug">
                    "Данные успешно зафиксированы. <br />
                    Выполним соединение и регистрацию вашего узла в финансовой
                    сети."
                  </p>
                  <div className="p-4 bg-white/5 border border-white/10 font-mono text-xs text-gray-400 space-y-2 mt-4 select-none">
                    <p>{`>>> INTEGRITY_CHECK: PASSED`}</p>
                    <p>{`>>> USER_NODE: ${formData.nickname ? formData.nickname.toUpperCase() : "CLIENT"}`}</p>
                    <p>{`>>> EMAIL: ${formData.email}`}</p>
                    <p>{`>>> LOC: ${formData.country || "NOT_SPECIFIED"}`}</p>
                    <p>{`>>> INFLOW: $${formatAmount(numIncome)} / OUTFLOW: $${formatAmount(numExpenses)}`}</p>
                    <p>{`>>> CURRENT_SAVINGS: $${formatAmount(numSavings)}`}</p>
                  </div>
                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs">
                      {`>>> ERROR: ${error}`}
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {activeStepError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[11px] max-w-md mt-4 flex items-start gap-2 overflow-hidden"
                  >
                    <span className="shrink-0 select-none text-rose-500 font-bold">
                      [ ! ]
                    </span>
                    <div>
                      <span className="font-bold block uppercase text-[10px] text-rose-500 tracking-wider mb-0.5">
                        // VALIDATION_CRITICAL_ERR
                      </span>
                      <span>{activeStepError}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showExpensesWarning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-[11px] max-w-md mt-4 flex items-start gap-2 overflow-hidden"
                  >
                    <span className="shrink-0 select-none text-yellow-500 font-bold">
                      [ ! ]
                    </span>
                    <div>
                      <span className="font-bold block uppercase text-[10px] text-yellow-500 tracking-wider mb-0.5">
                        // SMART_BUDGET_WARNING
                      </span>
                      <span>
                        Внимание: ваши ежемесячные расходы превышают указанный
                        доход. Профицит отсутствует. Рекомендуется оптимизация.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* НАВИГАЦИЯ */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="px-6 py-4 border-b-2 border-white/20 text-gray-400 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors duration-200 disabled:opacity-50"
                >
                  ← Назад
                </button>
              )}

              {step < 8 ? (
                <TypicalButton
                  type="submit"
                  className="min-w-[140px]"
                  disabled={
                    loading ||
                    usernameChecking ||
                    emailChecking ||
                    !!activeStepError
                  }
                >
                  Продолжить
                </TypicalButton>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !!activeStepError}
                  className="group relative overflow-hidden border border-yellow-500 px-8 py-4 font-mono tracking-widest text-xs uppercase text-yellow-500 hover:text-black transition-colors duration-500 shadow-[0_0_40px_rgba(234,179,8,0.1)] min-w-[180px] disabled:opacity-50"
                >
                  <span className="relative z-10">
                    {loading ? "Соединение..." : "Перейти в личный кабинет →"}
                  </span>
                  <div className="absolute bottom-0 left-0 h-full w-full bg-yellow-500 origin-bottom scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100 z-0" />
                </button>
              )}
            </div>
          </form>
        </motion.section>
      </div>

      <footer className="relative z-10 flex justify-between items-center border-t border-white/5 pt-4 font-mono text-[10px] text-gray-600">
        <div>SECURE CLIENT_ID: SHA-256</div>
        <div>FINORA CORE v1.0.8</div>
      </footer>
    </main>
  );
}
