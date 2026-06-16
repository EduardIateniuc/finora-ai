import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const fallbackResponse = {
    globalInvestments: [
      { title: "Vanguard S&P 500 ETF (VOO)", platform: "Interactive Brokers", yieldRate: 10.5, minEntry: 100, description: "Инвестиции в топ-500 корпораций США через IBKR.", url: "https://www.interactivebrokers.com" },
      { title: "Казначейские облигации США (T-Bills)", platform: "Interactive Brokers / Webull", yieldRate: 5.2, minEntry: 1000, description: "Самый безрисковый долларовый инструмент в мире.", url: "https://www.interactivebrokers.com" }
    ],
    investmentRecommendation: "Инвестируйте свободный профицит капитала на международном рынке."
  };

  try {
    let rawBody = "";
    try { rawBody = await req.text(); } catch (e) { console.error(e); }
    if (!rawBody || rawBody.trim() === "") rawBody = "{}";
    const payload = JSON.parse(rawBody);

    const baseSalary = payload.baseSalary ?? 25000;
    const baseExpenses = payload.baseExpenses ?? 12000;
    const netTransactions = payload.netTransactions ?? 0;
    const nickname = payload.nickname ?? "Клиент";
    const goalName = payload.goalName ?? "Lexus IS";

    // ИСПРАВЛЕНО: Расчет профицита (Доход - Расходы + Транзакции)
    const surplus = Math.max(0, baseSalary - baseExpenses + netTransactions);

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
      Вы профессиональный финансовый AI-консультант "Finora" в Молдове на текущий 2026 год.
      Проанализируйте инвестиционные возможности пользователя:
      - Имя пользователя: ${nickname}
      - Ежемесячный профицит: ${surplus} USD.

      Сформируйте ответ СТРОГО в формате валидного JSON со следующей структурой (без эмодзи):
      {
        "globalInvestments": [
          {
            "title": "Название инвестиционного инструмента мирового уровня (НЕ в Молдове: например, ETF VOO, MSCI World, акции Apple/Microsoft, облигации США)",
            "platform": "Через какую глобальную платформу инвестировать (например, Interactive Brokers, Webull, Saxo Bank)",
            "yieldRate": число (ожидаемая доходность % годовых),
            "minEntry": число (минимальный порог входа в USD),
            "description": "Как именно пользователю инвестировать в этот инструмент, налоги, надежность, ликвидность",
            "url": "официальная ссылка на сайт брокера или фонда для открытия счета"
          }
        ],
        "investmentRecommendation": "Сводный совет по инвестированию свободного профицита бюджета пользователя в размере ${surplus} USD."
      }

      Сгенерируйте ровно 6 инвестиционных направления мирового уровня: консервативное, умеренное и агрессивное.
    `;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ model: targetModel, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
    });

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("Investments route error:", error);
    return NextResponse.json(fallbackResponse);
  }
}