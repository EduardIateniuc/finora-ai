import { NextResponse } from 'next/server';

interface StrategyOption {
  title: string;
  description: string;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedYield: string;
  platform: string;
  url: string;
}

interface AdviceResponse {
  summary: string;
  strategies: StrategyOption[];
  allocationPlan: string;
  pinnableAdvice: string;
}

interface AdviceRequestPayload {
  salary?: number;
  expenses?: number;
  savings?: number;
  nickname?: string;
  goals?: any[];
  transactions?: any[];
}

export async function POST(req: Request): Promise<Response> {
  const fallbackResponse: AdviceResponse = {
    summary: "Ваш бюджет находится в стабильном состоянии, однако свободный профицит подвержен инфляционному давлению. Рекомендуется диверсификация.",
    strategies: [
      {
        title: "Консервативные Гособлигации (VMS Молдова)",
        description: "Покупка государственных ценных бумаг (ГЦБ) Республики Молдова напрямую через авторизованные коммерческие банки (maib, Victoriabank). Стабильный фиксированный доход, освобожденный от подоходного налога для физлиц.",
        difficulty: "LOW",
        expectedYield: "6.0% - 7.5% годовых",
        platform: "Министерство Финансов РМ / Коммерческие Банки",
        url: "https://www.maib.md/ro/individuals/economii-si-investitii/valori-mobiliare-de-stat"
      },
      {
        title: "Глобальное Индексирование (Vanguard S&P 500 ETF)",
        description: "Автоматизированная покупка ETF (тикер: VOO или SPYL) через регулируемого брокера Interactive Brokers. Широкая диверсификация на 500 крупнейших корпораций США с низкими комиссиями управления (0.03%).",
        difficulty: "MEDIUM",
        expectedYield: "10.2% годовых",
        platform: "Interactive Brokers (IBKR)",
        url: "https://www.interactivebrokers.com"
      },
      {
        title: "Высоколиквидный Накопительный Депозит",
        description: "Размещение тактического резерва в системно значимых банках Молдовы с возможностью пополнения и частичного снятия без потери процентов.",
        difficulty: "LOW",
        expectedYield: "3.5% - 4.5% годовых",
        platform: "Moldindconbank / maib",
        url: "https://www.micb.md/depozite"
      }
    ],
    allocationPlan: "Рекомендуется делить ежемесячный свободный профицит по следующей схеме: 20% — пополнение краткосрочной подушки безопасности в банке РМ, 40% — автоматическое инвестирование в долгосрочные ETF (Interactive Brokers), 40% — распределение по активным целям в личном кабинете.",
    pinnableAdvice: "Сформируйте резервный фонд на 6 месяцев расходов, после чего автоматизируйте ежемесячные покупки ETF VOO через брокера Interactive Brokers."
  };

  try {
    let payload: AdviceRequestPayload = {};
    try {
      payload = await req.json();
    } catch (e) {
      console.warn("Payload parse warning, utilizing fallback strategy");
    }

    const salary: number = payload.salary ?? 25000;
    const expenses: number = payload.expenses ?? 12000;
    const savings: number = payload.savings ?? 5000;
    const nickname: string = payload.nickname ?? "Клиент";
    const goalsCount: number = payload.goals?.length ?? 0;
    const transactionsCount: number = payload.transactions?.length ?? 0;
    const surplus: number = Math.max(0, salary - expenses);

    const apiKey = process.env.OPENROUTER_API_KEY;
    const configuredModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat:free';
    const hasValidKey = apiKey && apiKey !== "undefined" && apiKey !== "null" && apiKey.trim() !== "";

    if (!hasValidKey) return NextResponse.json(fallbackResponse);

    let apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    let targetModel = configuredModel;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

    if (apiKey.startsWith('gsk_')) {
      apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      targetModel = 'llama-3.3-70b-versatile'; 
    } else {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'AI Financial Copilot';
    }

    const prompt = `
      Вы профессиональный финансовый AI-аналитик "Finora" в Молдове на текущий 2026 год.
      Проведите детальный аудит личного бюджета пользователя на основе предоставленной телеметрии:
      - Имя пользователя: ${nickname}
      - Ежемесячные доходы (база + транзакции): $${salary} USD.
      - Ежемесячные расходы (база + транзакции): $${expenses} USD.
      - Чистый профицит бюджета: $${surplus} USD.
      - Текущие общие сбережения (базовый резерв): $${savings} USD.
      - Активных финансовых целей в базе: ${goalsCount} шт., операций записано: ${transactionsCount} шт.

      Разработайте строгий, реалистичный и пошаговый план управления капиталом для быстрого роста с минимальным уровнем риска:
      1. Проведите глубокую диагностику бюджета: оцените достаточность резерва ($${savings} USD) относительно месячных трат ($${expenses} USD). 
      2. Предложите ровно 3 конкретных инвестиционных тактики с низким и средним риском, доступных для граждан Молдовы в 2026 году. Опишите по каждой тактике: надежность, порог входа, налоги, ликвидность и конкретную платформу.
      3. Распишите пошаговый план распределения ежемесячного профицита в размере $${surplus} USD. Укажите четкие суммы в USD и доли (например: 20% в резерв, 50% в ценные бумаги и т.д.) для ускорения достижения целей и сложного процента.
      4. Сгенерируйте один ультра-короткий совет (до 150 символов) для закрепления на панели профиля.

      Предоставьте ссылки на надежные платформы:
      - Для глобальных инвестиций: Interactive Brokers (IBKR), Webull.
      - Для локальных надежных инвестиций: maib (ГЦБ/VMS Молдовы), Moldindconbank (ликвидные депозиты), Министерство Финансов РМ.

      Сформируйте ответ СТРОГО в формате валидного JSON со следующей структурой (без эмодзи):
      {
        "summary": "Глубокий разбор текущего бюджета, оценка подушки безопасности и финансовой устойчивости.",
        "strategies": [
          {
            "title": "Инструмент (например: Портфель ETF VOO через Interactive Brokers, ГЦБ Молдовы через maib)",
            "description": "Пошаговый план покупки из Молдовы, налогообложение в РМ, риски и ликвидность.",
            "difficulty": "LOW или MEDIUM",
            "expectedYield": "Ожидаемая доходность годовых в %",
            "platform": "Название платформы/брокера/биржи",
            "url": "Реальная ссылка на сайт брокера или страницу услуги на сайте банка РМ"
          }
        ],
        "allocationPlan": "Подробный план распределения профицита в размере $${surplus} USD по конкретным направлениям с точными цифрами в USD.",
        "pinnableAdvice": "Краткий совет до 150 символов для профиля."
      }

      Сгенерируйте ровно 3 тактики в массиве 'strategies'. Цены пишите числами. Ссылки должны быть полностью рабочими и вести на официальные сайты.
    `;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ model: targetModel, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
    });

    const data = await response.json();
    const rawContent: string = data.choices[0].message.content;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]) as AdviceResponse;
      return NextResponse.json(parsedData);
    } else {
      throw new Error("No valid JSON structure found in advices response");
    }

  } catch (error) {
    console.error("Advices route error:", error);
    return NextResponse.json(fallbackResponse);
  }
}