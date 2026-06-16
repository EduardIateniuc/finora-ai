import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const fallbackResponse = {
    identifiedRisks: "Риски бюджета находятся на стабильном уровне.",
    riskDetails: [
      { category: "Инфляционный риск", level: "MEDIUM", description: "Инфляция снижает покупательную способность MDL накоплений.", mitigation: "Инвестирование в ГЦБ." }
    ],
    savingTips: [
      { tip: "Автоматизация", action: "Откладывайте 20% доходов в начале месяца.", source: "НБМ", sourceUrl: "https://bnm.md" }
    ]
  };

  try {
    let rawBody = "";
    try { rawBody = await req.text(); } catch (e) { console.error(e); }
    if (!rawBody || rawBody.trim() === "") rawBody = "{}";
    const payload = JSON.parse(rawBody);

    const salary = payload.salary ?? 25000;
    const expenses = payload.expenses ?? 12000;
    const nickname = payload.nickname ?? "Клиент";
    const goalName = payload.goalName ?? "Tesla";

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
      Вы профессиональный финансовый AI-риск-аудитор "Finora" в Молдове на текущий 2026 год.
      Проведите аудит рисков бюджета:
      - Пользователь: ${nickname}, Доход: ${salary} USD, расходы: ${expenses} USD.
      - Макроэкономика Молдовы: инфляция 6.8%, ставка НБМ 6.50%.

      Сформируйте ответ СТРОГО в формате валидного JSON со следующей структурой (без эмодзи):
      {
        "identifiedRisks": "Краткое общее заключение по рискам бюджета",
        "riskDetails": [
          {
            "category": "Название категории риска (Инфляционный, Валютный, Кредитный, Риск потери дохода)",
            "level": "HIGH / MEDIUM / LOW",
            "description": "Подробное описание риска для бюджета пользователя с указанием конкретных расчетных цифр потерь",
            "mitigation": "Конкретный практический шаг по минимизации"
          }
        ],
        "savingTips": [
          {
            "tip": "Название тактического совета дня по экономии",
            "action": "Конкретное пошаговое действие",
            "source": "Авторитетный источник (например, Минфин РМ, НБМ)",
            "sourceUrl": "Официальная ссылка на источник"
          }
        ]
      }

      Сгенерируйте ровно 4 детальных риска и ровно 3 совета дня.
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
    console.error("Risks route error:", error);
    return NextResponse.json(fallbackResponse);
  }
}