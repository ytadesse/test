/**
 * Gemini AI Product Identification Service
 *
 * Uses Google's Gemini API to analyze images and identify products.
 * Falls back to mock identification when no API key is configured.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
}

/**
 * Identify products in an image using Gemini Vision.
 * @param {string} base64Image - base64 encoded image data (without data URL prefix)
 * @param {string} mimeType - image MIME type (e.g. 'image/jpeg')
 * @returns {Promise<Array<{name: string, category: string, condition: string, description: string}>>}
 */
export async function identifyProducts(base64Image, mimeType = 'image/jpeg') {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('No Gemini API key configured. Using mock identification.');
    return mockIdentifyProducts();
  }

  const prompt = `Analyze this image and identify all sellable products/items visible.
For each item, return a JSON array with objects containing:
- "name": specific product name (e.g. "Sony WH-1000XM4 Headphones", not just "headphones")
- "category": product category (e.g. "Electronics", "Furniture", "Clothing", "Books", "Kitchen", "Decor", "Sports")
- "condition": estimated condition ("New", "Like New", "Good", "Fair", "Poor")
- "description": brief description useful for a resale listing (1-2 sentences)

Return ONLY valid JSON array, no markdown or extra text.
If no sellable items found, return an empty array [].`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse product identification results');
  }

  return JSON.parse(jsonMatch[0]);
}

/** Mock product identification for demo/development */
function mockIdentifyProducts() {
  const mockProducts = [
    [
      { name: 'Apple MacBook Pro 14"', category: 'Electronics', condition: 'Good', description: 'Apple laptop with Retina display. Shows normal signs of use.' },
      { name: 'Bose QuietComfort 45 Headphones', category: 'Electronics', condition: 'Like New', description: 'Over-ear noise cancelling headphones in excellent condition.' },
    ],
    [
      { name: 'IKEA KALLAX Shelf Unit', category: 'Furniture', condition: 'Good', description: '4x2 shelf unit in white. Minor scratches on top surface.' },
      { name: 'Vintage Table Lamp', category: 'Decor', condition: 'Fair', description: 'Brass base table lamp with fabric shade. Some patina on base.' },
      { name: 'Assorted Hardcover Books (lot of 12)', category: 'Books', condition: 'Good', description: 'Mixed fiction and non-fiction hardcovers in good reading condition.' },
    ],
    [
      { name: 'KitchenAid Stand Mixer', category: 'Kitchen', condition: 'Good', description: 'Classic tilt-head stand mixer in Empire Red. Includes paddle and whisk attachments.' },
      { name: 'Le Creuset Dutch Oven 5.5qt', category: 'Kitchen', condition: 'Like New', description: 'Enameled cast iron dutch oven in Flame color. Barely used.' },
    ],
    [
      { name: 'Nike Air Max 90', category: 'Clothing', condition: 'Good', description: 'Men\'s size 10 sneakers in white/grey colorway. Light wear on soles.' },
      { name: 'Levi\'s 501 Original Jeans', category: 'Clothing', condition: 'Good', description: 'Classic straight fit in medium wash. Size 32x32.' },
    ],
  ];

  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomSet = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      resolve(randomSet);
    }, 1500);
  });
}

export default { identifyProducts };
