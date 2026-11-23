import { config } from '../config/env.js';

/**
 * AI Controller powering Groq Vision & Text Processing via secure backend proxy
 */
export async function extractReceipt(req, res) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    if (!config.groqApiKey) {
      return res.status(503).json({
        error: 'GROQ_API_KEY is not configured on the backend. Please add it to your .env file or enter the bill items manually.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const prompt = `You are an expert restaurant receipt OCR reader.
Examine this restaurant bill carefully. Extract all line items, quantities, prices, taxes (CGST, SGST, VAT), service charge, discounts, round-off, and printed grand total.

CRITICAL INSTRUCTIONS:
1. Extract line items accurately with name, quantity and total item price.
2. If an item or number is blurry, smudged, or uncertain, mark "confidence": "low". Otherwise "high".
3. Separate CGST and SGST if present. If not found, use 0.
4. Extract Service Charge, Discount, and Round Off if present. If not found, use 0.
5. printedTotal must be the exact printed total on the bill.
6. Return strictly valid JSON with this schema ONLY:
{
  "restaurantName": "Spice Garden",
  "items": [
    {
      "name": "Chicken Biryani",
      "qty": 1,
      "price": 320,
      "confidence": "high"
    }
  ],
  "cgst": 21,
  "sgst": 21,
  "serviceCharge": 84,
  "discount": 0,
  "roundOff": 0,
  "printedTotal": 966
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.groqTimeout);

    try {
      const groqResponse = await fetch(`${config.groqBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.groqApiKey}`,
        },
        body: JSON.stringify({
          model: config.groqVisionModel,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${cleanBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!groqResponse.ok) {
        const errText = await groqResponse.text();
        let message = errText;
        try {
          const parsed = JSON.parse(errText);
          message = parsed.error?.message || errText;
        } catch {}
        console.error('Groq Vision API Error:', groqResponse.status, message);
        return res.status(groqResponse.status).json({
          error: `Groq Vision Error: ${message}`,
          fallbackAvailable: true,
        });
      }

      const data = await groqResponse.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Sanitize extracted structure
      const result = {
        restaurantName: (parsed.restaurantName || 'Restaurant Bill').trim(),
        items: Array.isArray(parsed.items)
          ? parsed.items.map((it, idx) => ({
              id: `item_${Date.now()}_${idx + 1}`,
              name: String(it.name || `Item ${idx + 1}`).trim(),
              qty: parseInt(it.qty, 10) || 1,
              price: parseFloat(it.price) || 0,
              confidence: it.confidence === 'low' ? 'low' : 'high',
              assignedTo: [],
            }))
          : [],
        cgst: parseFloat(parsed.cgst) || 0,
        sgst: parseFloat(parsed.sgst) || 0,
        serviceCharge: parseFloat(parsed.serviceCharge) || 0,
        discount: parseFloat(parsed.discount) || 0,
        roundOff: parseFloat(parsed.roundOff) || 0,
        printedTotal: parseFloat(parsed.printedTotal) || 0,
      };

      return res.json(result);
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'Groq API request timed out after 30 seconds.' });
      }
      throw fetchErr;
    }
  } catch (err) {
    console.error('Receipt Extraction Error:', err);
    return res.status(500).json({
      error: `Failed to extract receipt: ${err.message || 'Unknown server error'}`,
      fallbackAvailable: true,
    });
  }
}

/**
 * Natural language voice prompt to item assignments
 */
export async function mapVoiceToItems(req, res) {
  try {
    const { transcript, items = [], userName = 'Me' } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript text is required' });
    }

    if (!config.groqApiKey) {
      return res.status(503).json({
        error: 'GROQ_API_KEY is not configured on the backend.',
      });
    }

    const itemsSummary = items
      .map((it) => `- ID: "${it.id}", Name: "${it.name}", Price: ₹${it.price}`)
      .join('\n');

    const prompt = `You are a voice-driven restaurant bill splitting assistant.
A group of friends spoke about who consumed what dishes:
"${transcript}"

Here are the available bill items:
${itemsSummary}

TASK:
1. Identify all people mentioned.
2. ALWAYS normalize "I", "me", "myself", "mine", "maine", "mera" to "${userName}".
3. Assign which person had which items.
4. If two people shared an item (e.g. "Rohan and I shared paneer tikka"), assign that item to both ["${userName}", "Rohan"].
5. Do NOT invent items.
6. Return JSON with this exact schema:
{
  "people": ["${userName}", "Rohan", "Priya"],
  "assignments": {
    "item_id_1": ["${userName}"],
    "item_id_2": ["${userName}", "Rohan"]
  }
}`;

    const groqResponse = await fetch(`${config.groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: config.groqTextModel,
        messages: [
          {
            role: 'system',
            content: 'You are an intelligent bill splitting assistant. Return valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      return res.status(groqResponse.status).json({ error: `Groq text error: ${errText}` });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return res.json({
      people: Array.isArray(parsed.people) ? parsed.people : [userName],
      assignments: parsed.assignments || {},
    });
  } catch (err) {
    console.error('Voice Split Error:', err);
    return res.status(500).json({ error: `Voice split error: ${err.message}` });
  }
}

/**
 * Health check endpoint for Groq configuration
 */
export function getAiHealth(req, res) {
  res.json({
    hasGroqKey: Boolean(config.groqApiKey),
    visionModel: config.groqVisionModel,
    textModel: config.groqTextModel,
    baseUrl: config.groqBaseUrl,
  });
}
