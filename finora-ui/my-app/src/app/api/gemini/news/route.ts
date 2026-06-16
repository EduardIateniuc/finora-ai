import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const dateFormatted = today.split('-').reverse().join('.');

    const apiKey = process.env.OPENROUTER_API_KEY;
    const configuredModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat:free';
    const hasValidKey = apiKey && apiKey !== "undefined" && apiKey !== "null" && apiKey.trim() !== "";

    const fallbackNews = [
      {
        id: `news_${today.replace(/-/g, "")}_1`,
        title: "Глобальное укрепление USD и доходность облигаций",
        category: "MARKET_PULSE",
        content: "Индекс доллара (DXY) тестирует новые годовые локальные максимумы. Доходность 10-летних гособлигаций США удерживается выше 4.35%.",
        advice: "Оптимальное время для удержания части капитала в долларовых инструментах с фиксированной доходностью (T-Bills) через глобальных брокеров.",
        date: dateFormatted
      },
      {
        id: `news_${today.replace(/-/g, "")}_2`,
        title: "Приток капитала в ETF S&P 500 бьет рекорды",
        category: "STOCK_MARKET",
        content: "Крупнейшие мировые фонды (VOO, SPY) зафиксировали чистый приток капитала более $12 млрд за последнюю неделю на фоне сильных отчетов IT-сектора.",
        advice: "Продолжайте регулярное усреднение позиций в индексных фондах широкого рынка по стратегии DCA.",
        date: dateFormatted
      },
      {
        id: `news_${today.replace(/-/g, "")}_3`,
        title: "Золото как защитный буфер в портфеле",
        category: "HEDGE_ASSETS",
        content: "Котировки золота демонстрируют низкую волатильность, выполняя роль надежного защитного актива в периоды геополитической нестабильности.",
        advice: "Рекомендуется удерживать от 5% до 10% вашего инвестиционного портфеля в драгоценных металлах для амортизации просадок.",
        date: dateFormatted
      }
    ];

    if (!hasValidKey) {
      return NextResponse.json({ news: fallbackNews });
    }

    let apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    let targetModel = configuredModel;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };

    if (apiKey.startsWith('gsk_')) {
      apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      targetModel = 'llama-3.3-70b-versatile'; 
    }

    const prompt = `
      Вы профессиональный финансовый AI-аналитик "Finora".
      Сгенерируйте ровно 3 актуальные, глубокие, информативные новости и инвестиционных совета на сегодня: ${dateFormatted}.
      Данные должны выглядеть ультра-профессионально, отражая реальные мировые рынки акций, облигаций и макроэкономики.

      Ответ отдайте СТРОГО в формате валидного JSON со следующей структурой:
      {
        "news": [
          {
            "id": "news_${today.replace(/-/g, "")}_1", 
            "title": "Заголовок новости дня",
            "category": "Категория (MARKET_PULSE / STOCK_MARKET / HEDGE_ASSETS)",
            "content": "Краткое описание макроэкономического события или тренда",
            "advice": "Actionable Advice: конкретный тактический совет инвестору в связи с этим событием",
            "date": "${dateFormatted}"
          }
        ]
      }
      Сгенерируйте ровно 6 новостей. ID элементов должны строго начинаться с префикса news_${today.replace(/-/g, "")}_ и заканчиваться порядковым номером.
    `;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ model: targetModel, messages: [{ role: 'user', content: prompt }], temperature: 0.1 }),
    });

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json({ news: [] });
  }
}