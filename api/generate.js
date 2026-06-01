export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { guests = 300, budget = 17, complexity = 'Średnia', staff = 6, dishes = {} } = req.body || {};

  const SYS = `Jesteś profesjonalnym AI Menu Architect i Executive Sous-Chef dla dużej restauracji lunch na ${guests} osób dziennie.
Myślisz jak: executive chef, kitchen manager, food cost controller, menu designer, food psychologist.

ZASADY:
1. BALANS: max 2 heavy dishes, min 1 light, 1 fresh element, max 1 exotic
2. KOLORY: zawsze zielony + pomarańczowy/czerwony. ZAKAZ: all-brown menu
3. TEKSTURY: creamy + fresh + crunchy + soft w każdym zestawie
4. FOOD COST: budżet na gościa ${budget} zł, food cost target max 30%
5. KUCHNIE: jeden day vibe — nie mieszaj chaotycznie kuchni
6. ZUPY: 1 comfort + 1 light. Nie: 2 czerwone, 2 kremowe
7. KITCHEN: złożoność ${complexity}, obsada ${staff} osób
8. GOŚĆ: 70% comfort, 20% modern, 10% experimental

Odpowiadaj TYLKO czystym JSON bez markdown.`;

  const dishList = Object.entries(dishes)
    .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
    .join('\n');

  const prompt = `Wybierz menu na 1 dzień z dostępnych dań:

${dishList}

Skład dnia:
- Zupy: 2 (1 mięsna + 1 wege/lekka)
- Dania mięsne: 3
- Dania rybne: 1
- Wegetariańskie: 1
- Wegańskie: 2
- Garnięry warzywne: 2
- Pierogi: 1
- Kopytka: 1
- Ziemniaki i kasze: 3
- Surówki: 5

Zwróć TYLKO czysty JSON:
{
  "vibe": "2-3 słowa opisujące vibe dnia po polsku",
  "selected": [
    {"name": "dokładna nazwa z listy", "group": "Zupy"},
    {"name": "dokładna nazwa z listy", "group": "Zupy"},
    {"name": "dokładna nazwa z listy", "group": "Dania mięsne"},
    {"name": "dokładna nazwa z listy", "group": "Dania mięsne"},
    {"name": "dokładna nazwa z listy", "group": "Dania mięsne"},
    {"name": "dokładna nazwa z listy", "group": "Dania rybne"},
    {"name": "dokładna nazwa z listy", "group": "Wegetariańskie"},
    {"name": "dokładna nazwa z listy", "group": "Wegańskie"},
    {"name": "dokładna nazwa z listy", "group": "Wegańskie"},
    {"name": "dokładna nazwa z listy", "group": "Garnięry warzywne"},
    {"name": "dokładna nazwa z listy", "group": "Garnięry warzywne"},
    {"name": "dokładna nazwa z listy", "group": "Pierogi"},
    {"name": "dokładna nazwa z listy", "group": "Kopytka"},
    {"name": "dokładna nazwa z listy", "group": "Ziemniaki i kasze"},
    {"name": "dokładna nazwa z listy", "group": "Ziemniaki i kasze"},
    {"name": "dokładna nazwa z listy", "group": "Ziemniaki i kasze"},
    {"name": "dokładna nazwa z listy", "group": "Surówki"},
    {"name": "dokładna nazwa z listy", "group": "Surówki"},
    {"name": "dokładna nazwa z listy", "group": "Surówki"},
    {"name": "dokładna nazwa z listy", "group": "Surówki"},
    {"name": "dokładna nazwa z listy", "group": "Surówki"}
  ],
  "analysis": {
    "vibe": "2-3 słowa po polsku",
    "color_harmony": 87,
    "kitchen_stress": 64,
    "guest_appeal": 91,
    "food_cost_avg": 28,
    "frying_load": 55,
    "oven_load": 60,
    "warnings": ["ostrzeżenie jeśli jest problem z menu"],
    "suggestions": ["sugestia poprawy"]
  }
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
