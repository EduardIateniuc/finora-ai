import { NextResponse } from 'next/server';

interface NewDeal {
  title: string;
  price: number;
  dealerName: string;
  description: string;
  url: string;
}

interface UsedDeal {
  title: string;
  price: number;
  description: string;
  url: string;
}

interface MarketResponse {
  marketAnalysis: string;
  newDeals: NewDeal[];
  usedDeals: UsedDeal[];
}

export async function POST(req: Request): Promise<Response> {
  const defaultGoalName = "Смартфон";
  const defaultGoalAmount = 1000;

  let payload: any = {};
  try { 
    payload = await req.json(); 
  } catch (e) { 
    console.warn("Payload parse warning, using fallback variables");
  }

  const goalName: string = (payload?.goalName && typeof payload.goalName === 'string' && payload.goalName.trim() !== "") 
    ? payload.goalName 
    : defaultGoalName;

  const goalTargetAmount: number = (payload?.goalTargetAmount && Number(payload.goalTargetAmount) > 0) 
    ? Number(payload.goalTargetAmount) 
    : defaultGoalAmount;

  const nickname: string = payload?.nickname || "Клиент";

  const fallbackResponse: MarketResponse = {
    marketAnalysis: `Для вашей цели ${goalName} на рынке Молдовы в 2026 году средний бюджет стабилен. Поиск на 999.md и в магазинах Кишинева показывает достаточный выбор предложений.`,
    newDeals: [
      {
        title: `Новый ${goalName} в Enter`,
        price: goalTargetAmount,
        dealerName: "Enter.md",
        description: "Официальный сертифицированный товар в розничной сети Молдовы. Полная гарантия 2 года, оригинальная заводская упаковка.",
        url: "https://enter.md"
      },
      {
        title: `Новый ${goalName} в Darwin`,
        price: Math.round(goalTargetAmount * 1.05),
        dealerName: "Darwin.md",
        description: "Официальные продажи в РМ, возможность оформления беспроцентной рассрочки, кэшбэк и сертифицированное обслуживание.",
        url: "https://darwin.md"
      },
      {
        title: `Новый ${goalName} в Maximum`,
        price: Math.round(goalTargetAmount * 0.98),
        dealerName: "Maximum.md",
        description: "Официальный импорт, регулярные скидки по дисконтной карте сети, полный комплект документов.",
        url: "https://maximum.md"
      }
    ],
    usedDeals: [
      {
        title: `${goalName} (Отличное состояние на 999)`,
        price: Math.round(goalTargetAmount * 0.75),
        description: "Предложение от частного лица в Кишиневе. Минимальные следы использования, оригинальный комплект, полностью работоспособен.",
        url: `https://999.md/ru/search?query=${encodeURIComponent(goalName)}`
      },
      {
        title: `${goalName} (Выгодная цена на вторичном рынке)`,
        price: Math.round(goalTargetAmount * 0.60),
        description: "Вариант со следами естественного износа. Продается срочно, возможен аргументированный торг при встрече в центре.",
        url: `https://999.md/ru/search?query=${encodeURIComponent(goalName)}`
      },
      {
        title: `${goalName} (Б/У под восстановление на 999.md)`,
        price: Math.round(goalTargetAmount * 0.40),
        description: "Требует косметического или аппаратного ремонта. Идеальный вариант для тех, кто хочет сэкономить и восстановить устройство самостоятельно.",
        url: `https://999.md/ru/search?query=${encodeURIComponent(goalName)}`
      }
    ]
  };

  const apiKey = process.env.OPENROUTER_API_KEY;
  const configuredModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat:free';
  const hasValidKey = apiKey && apiKey !== "undefined" && apiKey !== "null" && apiKey.trim() !== "";

  if (!hasValidKey) return NextResponse.json(fallbackResponse);

  try {
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
      Пользователь ${nickname} хочет накопить на цель "${goalName}" с бюджетом $${goalTargetAmount} USD.

      Сделайте глубокий анализ рынка Молдовы. Сформируйте ровно 3 варианта НОВЫХ товаров у официальных импортеров/дилеров/магазинов в Молдове (например: Enter, Darwin, Maximum, Bomba для электроники; официальные автосалоны DAAC Hermes, Toyota, Hyundai для автомобилей; новые ЖК для недвижимости) и ровно 3 Б/У предложения на вторичном рынке Молдовы с доски объявлений 999.md.

      Ссылки (url) должны быть максимально реалистичными, направляющими на реальные разделы поиска:
      - Для Б/У: разделы или поисковая выдача на "https://999.md/ru/search?query=..." с нужными ключевыми словами.
      - Для НОВЫХ: официальные сайты дилеров/магазинов в Молдове (например, darwin.md, enter.md, maximum.md, bomba.md, landrover.md, hyundai.md, toyota.md, remax.md и т.д.) в зависимости от категории товара.

      Сформируйте ответ СТРОГО в формате валидного JSON со следующей структурой (без эмодзи, только чистый JSON):
      {
        "marketAnalysis": "Анализ рынка данной категории в РМ на 2026 год: доступность новых товаров у дилеров, средние цены на вторичке 999.md, налоги/пошлины, ликвидность модели и особенности подбора.",
        "newDeals": [
          {
            "title": "Название нового товара/услуги у конкретного дилера в Молдове",
            "price": число (числовое значение ориентировочной цены нового товара в USD),
            "dealerName": "Название магазина/салона (например: Enter, DAAC Hermes и тд.)",
            "description": "Спецификация нового товара: заводская гарантия в РМ, нулевой пробег/износ, преимущества официальной покупки.",
            "url": "Прямая реалистичная ссылка на сайт этого дилера/магазина в Молдове для покупки"
          }
        ],
        "usedDeals": [
          {
            "title": "Название б/у предложения на вторичном рынке РМ",
            "price": число (числовое значение ориентировочной цены б/у товара в USD на 999.md),
            "description": "Спецификация б/у товара: типичный пробег/износ на рынке РМ, состояние, почему этот вариант выгоден для покупки.",
            "url": "Прямая поисковая ссылка на 999.md с запросом по этой модели"
          }
        ]
      }
      Сгенерируйте ровно по 3 элемента в массивах newDeals и usedDeals. Цены (price) пишите исключительно как числа (например, 15000, а не "$15,000").
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
      const parsedData = JSON.parse(jsonMatch[0]) as MarketResponse;
      return NextResponse.json(parsedData);
    } else {
      throw new Error("No valid JSON structure found in the LLM response text");
    }

  } catch (error) {
    console.error("Market route error:", error);
    return NextResponse.json(fallbackResponse);
  }
}