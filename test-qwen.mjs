import 'dotenv/config'
import fs from 'fs'

const image = fs.readFileSync('./public/sample-images/tomato-early-blight.jpg').toString('base64');
fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'qwen/qwen3.8-27b',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'You are a careful agricultural vision assistant. Analyze this Tomato leaf image. Return ONLY valid JSON with this exact shape: {"crop":"string","disease":"string","confidence":100,"severity":"Low|Moderate|High|Unknown","treatable":true,"summary":"string","actions":["string"],"treatmentSteps":["string"],"prevention":["string"],"medicines":["string"]}. Explain visual evidence.'
          },
          {
            type: 'image_url',
            image_url: { url: 'data:image/jpeg;base64,' + image }
          }
        ]
      }
    ],
    response_format: { type: 'json_object' }
  })
}).then(r => r.json().then(d => console.dir(d, {depth: null})));
