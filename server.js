require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin tidak diizinkan'));
  }
}));

app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Avenoire AI Proxy — Groq' });
});

app.post('/api/generate', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY belum di-set' });

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages wajib ada' });
  }

  const userMsg = messages[messages.length - 1].content || '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system || 'Kamu adalah AI travel planner profesional. Respond HANYA JSON valid tanpa markdown.' },
          { role: 'user',   content: userMsg }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'Groq error' });
    }

const text = data.choices?.[0]?.message?.content || '';

// Coba extract JSON dari response
let cleanText = text;
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (jsonMatch) cleanText = jsonMatch[0];

return res.json({ content: [{ type: 'text', text: cleanText }] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('✅ Avenoire Server jalan di port ' + PORT));