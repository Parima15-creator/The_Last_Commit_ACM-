import { GoogleGenAI } from '@google/genai';

/**
 * Enhances a receipt image using an offscreen HTML Canvas.
 * Optimizes thermal paper receipts by applying grayscale, contrast boost, and brightness adjustment.
 * Filter equivalent: grayscale(100%) contrast(150%) brightness(105%)
 *
 * @param {File|string} fileOrDataUrl - Image file or data URL
 * @returns {Promise<{ dataUrl: string, base64: string }>}
 */
export async function enhanceReceiptImage(fileOrDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 2048;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Apply visual enhancement filter for thermal receipts
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(105%)';
        ctx.drawImage(img, 0, 0, width, height);

        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = enhancedDataUrl.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        resolve({
          dataUrl: enhancedDataUrl,
          base64,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(new Error('Failed to load receipt image: ' + err));

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      reject(new Error('Invalid image input format'));
    }
  });
}

/**
 * Detects whether the active key is Groq (starts with gsk_) or Gemini.
 */
export function getActiveAiConfig(customApiKey) {
  const groqEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_API_KEY : '';
  const geminiEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : '';

  const key = (customApiKey || groqEnv || geminiEnv || '').trim();
  if (
    !key ||
    key === 'your_gemini_api_key' ||
    key === 'gsk_your_groq_api_key_here' ||
    key === 'your_groq_api_key_here'
  ) {
    return { provider: null, key: '' };
  }

  if (key.startsWith('gsk_') || (groqEnv && key === groqEnv)) {
    return { provider: 'groq', key };
  }

  return { provider: 'gemini', key };
}

/**
 * Executes a Groq OpenAI-compatible Chat Completion call
 */
async function callGroq({ apiKey, messages, model, responseFormat = { type: 'json_object' } }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: responseFormat,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.error?.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`Groq API Error (${res.status}): ${message}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '{}';
}

/**
 * Parses receipt image using Groq Vision (llama-3.2-11b-vision-preview) or Gemini 2.5 Flash Vision.
 *
 * @param {string} base64Image - Base64 encoded JPEG/PNG image data (without data: prefix)
 * @param {string} [apiKey] - Custom Groq or Gemini API key
 */
export async function parseReceiptImage(base64Image, apiKey) {
  const { provider, key } = getActiveAiConfig(apiKey);
  if (!provider || !key) {
    throw new Error('MISSING_API_KEY: Please provide a valid Groq API Key (starts with gsk_) or Gemini API Key in Settings or .env file');
  }

  const prompt = `You are an expert OCR financial receipt parser for Indian restaurant bills.
Examine this restaurant receipt carefully. Extract all line items, quantities, prices, taxes (CGST, SGST, VAT), service charge, discounts, round-off, and printed grand total.

CRITICAL RULES:
1. Identify all food/beverage items accurately. Preserve quantities.
2. The "price" must be the TOTAL line price for that item (e.g. qty 2 @ 100 = price 200).
3. If an item line or price is faded, smudged, torn, or uncertain, set "confidence": "low". Otherwise set "confidence": "high".
4. Separate CGST and SGST into individual rupee values.
5. Extract Service Charge, Discounts, and Round Off if present. If not present, set to 0.
6. printedTotal must be the exact grand total printed on the receipt.
7. Return clean JSON matching the following schema ONLY:
{
  "restaurantName": "Name of restaurant or 'Restaurant'",
  "items": [
    {
      "id": "item_1",
      "name": "Chicken Biryani",
      "qty": 1,
      "price": 320,
      "confidence": "high",
      "assignedTo": []
    }
  ],
  "cgst": 0,
  "sgst": 0,
  "serviceCharge": 0,
  "discount": 0,
  "roundOff": 0,
  "printedTotal": 0
}
Do not invent items that do not exist on the receipt. Return valid JSON only.`;

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    let jsonText = '';

    if (provider === 'groq') {
      // Groq Vision API
      jsonText = await callGroq({
        apiKey: key,
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
      });
    } else {
      // Gemini Vision API
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });
      jsonText = response.text;
    }

    const parsed = JSON.parse(jsonText);

    // Format item IDs consistently
    if (parsed.items && Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item, idx) => ({
        id: item.id || `item_${idx + 1}`,
        name: String(item.name || `Item ${idx + 1}`).trim(),
        qty: parseInt(item.qty, 10) || 1,
        price: parseFloat(item.price) || 0,
        confidence: item.confidence === 'low' ? 'low' : 'high',
        assignedTo: Array.isArray(item.assignedTo) ? item.assignedTo : [],
      }));
    }

    return parsed;
  } catch (err) {
    console.error('OCR parsing error:', err);
    throw new Error(`Failed to parse receipt with ${provider === 'groq' ? 'Groq Vision' : 'Gemini'}: ${err.message || err}`);
  }
}

/**
 * Maps voice transcript to bill items and group members.
 * Maps "I", "me", "myself", "maine" to "Me".
 * Supports Groq LLaMA 3.3, Gemini 2.5 Flash, and fallback heuristic matching.
 *
 * @param {string} transcript - Speech text e.g. "I had biryani, Rohan and I shared paneer tikka, Priya had cold coffee, Kabir had lime soda."
 * @param {Array} items - Available bill items
 * @param {string} [apiKey] - Custom Groq or Gemini API key
 * @returns {Promise<{ people: string[], assignments: Object }>}
 */
export async function mapVoiceToItems(transcript, items = [], apiKey) {
  if (!transcript || transcript.trim().length === 0) {
    return { people: [], assignments: {} };
  }

  const { provider, key } = getActiveAiConfig(apiKey);

  if (provider && key) {
    const itemListDescription = items
      .map((it) => `- ID: "${it.id}", Name: "${it.name}", Price: ₹${it.price}`)
      .join('\n');

    const prompt = `You are an intelligent natural language voice bill splitting assistant.
Here is a voice transcript of friends describing what food items they consumed:
"${transcript}"

Here are the available items on the restaurant bill:
${itemListDescription}

TASK:
1. Identify all people mentioned in the transcript.
2. ALWAYS normalize "I", "me", "myself", "maine", "mera", "mere" to "Me".
3. Map which people shared or ate which items based on the transcript.
4. If someone says "Rohan and I shared paneer tikka", assign that item to ["Me", "Rohan"].
5. If an item was not mentioned in the transcript, do not assign anyone to it (leave empty array []).
6. Do NOT invent items that are not in the bill.
7. Return ONLY clean JSON with this exact structure:
{
  "people": ["Me", "Rohan", "Priya", "Kabir"],
  "assignments": {
    "item_1": ["Me"],
    "item_2": ["Me", "Rohan"]
  }
}`;

    try {
      let jsonText = '';

      if (provider === 'groq') {
        // Groq LLaMA 3.3 Versatile
        jsonText = await callGroq({
          apiKey: key,
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent bill splitting assistant. Always return pure JSON matching the requested schema.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
      } else {
        // Gemini
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        jsonText = response.text;
      }

      const parsed = JSON.parse(jsonText);
      return {
        people: Array.isArray(parsed.people) ? parsed.people : [],
        assignments: parsed.assignments || {},
      };
    } catch (err) {
      console.warn('AI voice mapping error, falling back to heuristic matcher:', err);
    }
  }

  // Fallback offline rule-based natural language parser
  return heuristicVoiceMatcher(transcript, items);
}

/**
 * Robust fallback heuristic parser for voice input when offline or without API key.
 */
export function heuristicVoiceMatcher(transcript, items) {
  const peopleSet = new Set(['Me']);
  const assignments = {};
  items.forEach((it) => {
    assignments[it.id] = [];
  });

  const text = transcript.toLowerCase();

  const clauses = text
    .split(/[,.;]|(?:\band then\b)|(?:\balso\b)/)
    .map((c) => c.trim())
    .filter(Boolean);

  clauses.forEach((clause) => {
    const clausePeople = [];

    if (/\b(i|me|myself|mine|maine|mera)\b/i.test(clause)) {
      clausePeople.push('Me');
    }

    const nameMatches = clause.match(/\b([A-Za-z]+)\b(?=\s+(?:and\s+I\s+)?(?:had|ate|shared|took|ordered|drank|drinks))/i);
    if (nameMatches && nameMatches[1]) {
      const potentialName = capitalize(nameMatches[1]);
      if (!['I', 'We', 'Who', 'Everyone', 'All'].includes(potentialName)) {
        clausePeople.push(potentialName);
        peopleSet.add(potentialName);
      }
    }

    const sharedMatch = clause.match(/([a-zA-Z]+)\s+and\s+([a-zA-Z]+)\s+shared\s+(.*)/i);
    if (sharedMatch) {
      let p1 = capitalize(sharedMatch[1]);
      let p2 = capitalize(sharedMatch[2]);
      if (['I', 'Me', 'Myself'].includes(p1)) p1 = 'Me';
      if (['I', 'Me', 'Myself'].includes(p2)) p2 = 'Me';
      clausePeople.push(p1, p2);
      peopleSet.add(p1);
      peopleSet.add(p2);
    }

    items.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      const words = itemNameLower.split(/\s+/).filter((w) => w.length > 2);

      const isMatch = words.some((w) => clause.includes(w)) || clause.includes(itemNameLower);
      if (isMatch && clausePeople.length > 0) {
        const uniquePeople = Array.from(new Set([...(assignments[item.id] || []), ...clausePeople]));
        assignments[item.id] = uniquePeople;
      }
    });
  });

  return {
    people: Array.from(peopleSet),
    assignments,
  };
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
