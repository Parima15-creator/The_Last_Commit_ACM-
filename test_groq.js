import { config } from './server/config/env.js';

async function testGroqVisionURL() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + config.groqApiKey
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What is shown in this image?' },
          {
            type: 'image_url',
            image_url: {
              url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/LPU-v1-die.jpg'
            }
          }
        ]
      }]
    })
  });
  console.log(await res.text());
}

testGroqVisionURL();
