import { NextResponse } from 'next/server';

interface BankOption {
  id: string;
  name: string;
  rate: number;
  dae: number;
  maxAmount: number;
  type: string;
  url: string;
  features: string;
  earlyRepayment: string;
}

interface LoanResponse {
  banks: BankOption[];
  loanAdvice: string;
}

interface LoanRequestPayload {
  salary?: number;
  expenses?: number;
  loanAmount?: number;
  loanTerm?: number;
  nickname?: string;
  goalName?: string;
  goalTargetAmount?: number;
}

export async function POST(req: Request): Promise<Response> {
  const fallbackResponse: LoanResponse = {
    banks: [
      { id: "maib_classic", name: "maib (Classic)", rate: 9.00, dae: 9.38, maxAmount: 400000, type: "Потребительский", url: "https://maib.md/ro/individuals/credits/consumer-credit/", features: "Одобрение онлайн, без залога", earlyRepayment: "Без ограничений" },
      { id: "micb_consum", name: "Moldindconbank (Consum)", rate: 8.50, dae: 8.83, maxAmount: 400000, type: "Потребительский", url: "https://www.micb.md/credite/credit-de-consum", features: "Одобрение за 1 час", earlyRepayment: "Без ограничений" }
    ],
    loanAdvice: "Рекомендуется брать кредит только в случае стабильного профицита бюджета."
  };

  try {
    let payload: LoanRequestPayload = {};
    try {
      payload = await req.json();
    } catch (e) {
      console.warn("Payload parse warning, using fallback variables");
    }

    const salary: number = payload.salary ?? 25000;
    const expenses: number = payload.expenses ?? 12000;
    const loanAmount: number = payload.loanAmount ?? 10000;
    const loanTerm: number = payload.loanTerm ?? 24;
    const nickname: string = payload.nickname ?? "Клиент";
    const goalName: string = payload.goalName ?? "Смартфон";
    const goalTargetAmount: number = payload.goalTargetAmount ?? 1000;

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

    // ИСПРАВЛЕНО: Интегрирован детальный анализ кредитных условий под конкретную цель
    const prompt = `
      Вы профессиональный финансовый AI-консультант "Finora" в Молдове на текущий 2026 год.
      Проанализируйте параметры кредитования пользователя под конкретную финансовую цель:
      - Имя пользователя: ${nickname}
      - Ежемесячный доход: $${salary} USD, расходы: $${expenses} USD.
      - Потенциальная цель: "${goalName}" полной стоимостью $${goalTargetAmount} USD.
      - Запрашиваемая сумма кредита для немедленной покупки: $${loanAmount} USD (проанализируйте эквивалент в MDL по курсу ~18.0) на срок ${loanTerm} месяцев.
      - Базовая ставка НБМ: 6.50% годовых.

      Проведите детальную экспертную оценку:
      1. Насколько рационально брать кредит под цель "${goalName}"? Учтите износ (амортизацию) актива (например, техника и машины быстро дешевеют, недвижимость растет/сохраняет ценность).
      2. Рассчитайте DTI (отношение платежа к свободному профициту) и переплату. Сделайте вывод, стоит ли влезать в долг или безопаснее накопить.

      Сформируйте ответ СТРОГО в формате валидного JSON со следующей структурой (без эмодзи):
      {
        "banks": [
          {
            "id": "строка_уникальный_id",
            "name": "Название банка РМ (maib, MICB, OTP Bank, Victoriabank, FinComBank, BCR)",
            "rate": число_номинальная_ставка_от_8.0_до_10.5_пропорционально_ставке_НБМ,
            "dae": число_эффективная_ставка_DAE_чуть_выше_номинальной,
            "maxAmount": число_лимит_кредита_в_MDL_эквиваленте,
            "type": "Тип кредита (Потребительский / Автокредит / Ипотека)",
            "url": "Прямая ссылка на страницу кредитования на официальном сайте этого банка",
            "features": "2-3 преимущества кредита в этом банке через запятую",
            "earlyRepayment": "подробные правила досрочного погашения"
          }
        ],
        "loanAdvice": "Глубокий кредитный аудит для цели '${goalName}'. Анализ рисков потери стоимости актива, оценка переплаты под срок ${loanTerm} мес. и вердикт: брать кредит или продолжать копить автономно."
      }

      Сгенерируйте ровно 6 различных предложений от молдавских коммерческих банков.
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
      const parsedData = JSON.parse(jsonMatch[0]) as LoanResponse;
      return NextResponse.json(parsedData);
    } else {
      throw new Error("No valid JSON structure found in LLM loans response");
    }

  } catch (error) {
    console.error("Loans route error:", error);
    return NextResponse.json(fallbackResponse);
  }
}