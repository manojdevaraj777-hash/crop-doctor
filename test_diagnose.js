import 'dotenv/config';
import fs from 'fs';

const imagePath = 'C:\\Users\\manoj\\Downloads\\crop-images\\crop-3.jpg';
const buffer = fs.readFileSync(imagePath);
const base64 = buffer.toString('base64');
const dataUrl = `data:image/jpeg;base64,${base64}`;

const apiKey = process.env.GROQ_API_KEY;

async function test(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    })
  });
  const data = await res.json();
  console.log('Result:', data.choices?.[0]?.message?.content);
}

test('Identify the exact plant species shown in this image. Is it Maize (Corn), Sorghum, Pearl Millet (Bajra), or Rice? Explain the botanical evidence from the leaves, stalks, and inflorescence.');

