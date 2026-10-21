import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const app = express()
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })
const port = process.env.PORT || 8787
const DEFAULT_VISION_MODEL = 'qwen/qwen3.8-27b'
const DEFAULT_CHAT_MODEL = 'qwen/qwen3.8-27b'

import { DatabaseSync } from 'node:sqlite'

let isMongoConnected = false
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crop-doctor', { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    isMongoConnected = true
    console.log('✅ Connected to MongoDB Atlas!')
  })
  .catch(err => {
    isMongoConnected = false
    console.log('ℹ️ MongoDB is still connecting/configuring. Using high-speed Local SQLite database (crop-doctor.db) as fallback.')
  })

const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true, required: true }, password: { type: String, required: true } })
const User = mongoose.model('User', userSchema)

const recordSchema = new mongoose.Schema({ userEmail: String, crop: String, disease: String, confidence: Number, severity: String, treatable: Boolean, summary: String, cause: String, actions: [String], treatmentSteps: [String], organic: [String], prevention: [String], medicines: [String], date: String, fileName: String, imageUrl: String })
const Record = mongoose.model('Record', recordSchema)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, 'dist')

// Local SQLite fallback initialization
const localDb = new DatabaseSync(path.join(__dirname, 'crop-doctor.db'))
localDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userEmail TEXT,
    data TEXT
  );
`)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(process.env.GROQ_API_KEY),
    visionModel: process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL,
    chatModel: process.env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL,
    database: isMongoConnected ? 'mongodb' : 'sqlite-local',
    port,
  })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const rawEmail = req.body?.email || '';
    const email = rawEmail.toLowerCase().trim();
    const password = req.body?.password || '';
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    let user = null;
    if (isMongoConnected) {
      try { user = await User.findOne({ email }); } catch { user = null; }
    }
    if (!user) {
      const stmt = localDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?');
      user = stmt.get(email);
    }
    if (!user) return res.status(400).json({ error: 'User not found. Try registering instead.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password. Please check and try again.' });
    res.json({ name: user.name, email: user.email });
  } catch (err) { res.status(500).json({ error: 'Login failed: ' + err.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    const rawEmail = req.body?.email || '';
    const email = rawEmail.toLowerCase().trim();
    const password = req.body?.password || '';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are all required.' });
    }

    // Check duplicate in MongoDB if connected
    if (isMongoConnected) {
      try {
        const existingMongo = await User.findOne({ email });
        if (existingMongo) return res.status(400).json({ error: 'This email is already registered. Please sign in instead.' });
      } catch (err) {
        console.warn('MongoDB duplicate check note:', err.message);
      }
    }

    // Check duplicate in local SQLite fallback
    const checkStmt = localDb.prepare('SELECT id FROM users WHERE LOWER(email) = ?');
    if (checkStmt.get(email)) return res.status(400).json({ error: 'This email is already registered. Please sign in instead.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save locally
    const insertStmt = localDb.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    insertStmt.run(name, email, hashedPassword);

    // Also save in MongoDB if connected
    if (isMongoConnected) {
      try {
        const mongoUser = new User({ name, email, password: hashedPassword });
        await mongoUser.save();
      } catch (err) {
        console.warn('MongoDB sync note:', err.message);
      }
    }

    res.json({ name, email });
  } catch (err) { res.status(500).json({ error: 'Registration failed: ' + err.message }); }
});

app.get('/api/records', async (req, res) => {
  try {
    const rawEmail = req.query.email || '';
    const email = String(rawEmail).toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email is required to load records.' });

    if (isMongoConnected) {
      try {
        const records = await Record.find({ userEmail: email }).sort({ _id: -1 }).limit(50);
        return res.json(records.map(r => ({ ...r.toObject(), id: r._id.toString() })));
      } catch (err) {
        console.warn('MongoDB query fallback:', err.message);
      }
    }
    const stmt = localDb.prepare('SELECT id, data FROM records WHERE LOWER(userEmail) = ? ORDER BY id DESC LIMIT 50');
    const rows = stmt.all(email);
    const records = rows.map(r => {
      try {
        const obj = JSON.parse(r.data);
        return { ...obj, id: String(r.id) };
      } catch {
        return { id: String(r.id) };
      }
    });
    res.json(records);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch records.' }); }
});

app.post('/api/records', async (req, res) => {
  try {
    const rawEmail = req.body?.userEmail || '';
    const userEmail = String(rawEmail).toLowerCase().trim();
    if (!userEmail) return res.status(400).json({ error: 'User email is required to associate scan.' });

    const payload = { ...req.body, userEmail };
    const insertStmt = localDb.prepare('INSERT INTO records (userEmail, data) VALUES (?, ?)');
    const result = insertStmt.run(userEmail, JSON.stringify(payload));
    const localId = String(result.lastInsertRowid);

    if (isMongoConnected) {
      try {
        const record = new Record(payload);
        await record.save();
        return res.json({ ...record.toObject(), id: record._id.toString() });
      } catch (err) {
        console.warn('MongoDB record sync note:', err.message);
      }
    }
    res.json({ ...payload, id: localId });
  } catch (err) { res.status(500).json({ error: 'Failed to save record.' }); }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawEmail = req.query.email || '';
    const userEmail = String(rawEmail).toLowerCase().trim();
    if (!id || !userEmail) return res.status(400).json({ error: 'Record ID and user email are required.' });

    if (isMongoConnected) {
      try {
        await Record.deleteOne({ _id: id, userEmail });
      } catch (err) {
        console.warn('MongoDB delete note:', err.message);
      }
    }

    const stmt = localDb.prepare('DELETE FROM records WHERE (id = ? OR data LIKE ?) AND LOWER(userEmail) = ?');
    stmt.run(id, `%"id":"${id}"%`, userEmail);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record: ' + err.message });
  }
});

async function requestGroq(model, messages, options = {}) {
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.max_tokens ?? 2500,
    response_format: options.json ? { type: 'json_object' } : undefined,
  }
  const retryable = new Set([429, 500, 502, 503, 504])
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (result.ok || !retryable.has(result.status) || attempt === 2) return result
    let delay = 800 * (attempt + 1)
    try {
      const clone = result.clone()
      const data = await clone.json().catch(() => null)
      const retryInfo = data?.error?.details?.find((d) => d['@type']?.includes('RetryInfo'))
      if (retryInfo?.retryDelay) {
        const secs = parseInt(retryInfo.retryDelay, 10)
        if (!Number.isNaN(secs)) delay = secs * 1000 + 200
      }
    } catch { }
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  throw new Error('Groq request retry limit reached')
}

app.post('/api/diagnose', upload.single('image'), async (request, response) => {
  const crop = request.body?.crop || 'unknown crop'
  if (!request.file) return response.status(400).json({ error: 'An image is required.' })
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'Diagnosis is unavailable until GROQ_API_KEY is configured on the server.' })
  try {
    const base64Image = request.file.buffer.toString('base64')
    const mimeType = request.file.mimetype
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    const groqResponse = await requestGroq(
      process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL,
      [
        {
          role: 'system',
          content: `You are a careful agricultural assistant. Analyze crop leaf images and return ONLY valid JSON with this exact shape: {"crop":"string","disease":"string","confidence":number,"severity":"Low|Moderate|High|Unknown","treatable":boolean,"summary":"string","cause":"string","actions":["string"],"treatmentSteps":["string"],"organic":["string"],"prevention":["string"],"medicines":["string"]}. The 'summary' should be a concise 1-2 sentence explanation of the problem. The 'cause' must explain why this disease happened or how the plant was affected. You MUST provide highly detailed and comprehensive arrays for treatmentSteps, actions, organic (natural solutions), prevention, and medicines (chemical solutions), so the Treatment page has full, rich information.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyze this ${crop} leaf image.` },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      { json: true }
    )

    if (!groqResponse.ok) {
      const details = await groqResponse.text()
      console.error(`Groq returned ${groqResponse.status}: ${details}`)
      if (groqResponse.status === 429) return response.status(502).json({ error: 'Groq quota exceeded. Check your API limits.' })
      if (groqResponse.status === 404) return response.status(502).json({ error: `Model not found: ${process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL}.` })
      throw new Error(`Groq returned ${groqResponse.status}`)
    }

    const payload = await groqResponse.json()
    const text = payload.choices?.[0]?.message?.content?.replace(/```json|```/g, '').trim()
    if (!text) throw new Error('Empty Groq response')
    const result = JSON.parse(text)
    return response.json({ ...result, crop: result.crop || crop, confidence: Math.max(0, Math.min(100, Number(result.confidence) || 0)), isDemo: false })
  } catch (error) { console.error('DIAGNOSE ERROR:', error); return response.status(502).json({ error: 'The AI service could not complete this diagnosis. Please try again with a clearer photo.' }) }
})

app.post('/api/chat', async (request, response) => {
  const { message, crop = 'Tomato', diagnosis = null } = request.body || {}
  if (!message || typeof message !== 'string') return response.status(400).json({ error: 'Please enter a question.' })
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'The assistant is unavailable until GROQ_API_KEY is configured on the server.' })
  try {
    const prompt = `You are LeafLens, a careful agricultural assistant for farmers. Answer concisely in plain, very simple language. Avoid scientific jargon. Crop: ${crop}. Current scan: ${JSON.stringify(diagnosis)}. Farmer question: ${message}. Give practical, safety-conscious advice. Never invent certainty, never provide pesticide dosage beyond what the product label says, and recommend a local expert for severe problems.`
    const groqResponse = await requestGroq(
      process.env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ]
    )

    if (!groqResponse.ok) {
      const details = await groqResponse.text()
      console.error(`Groq chat returned ${groqResponse.status}: ${details}`)
      if (groqResponse.status === 429) return response.status(502).json({ error: 'Groq quota exceeded. Check your API limits.' })
      if (groqResponse.status === 404) return response.status(502).json({ error: `Model not found: ${process.env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL}.` })
      return response.status(502).json({ error: `Groq chat request failed with status ${groqResponse.status}. Check the API key, model, or quota.` })
    }

    const payload = await groqResponse.json()
    return response.json({ reply: payload.choices?.[0]?.message?.content || 'I could not generate an answer. Please try again.' })
  } catch (error) { console.error(error); return response.status(502).json({ error: 'The assistant could not complete the request. Check the API server logs for details.' }) }
})

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('/', (req, res) => res.sendFile(path.join(distPath, 'index.html')))
  app.get('/*splat', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    const indexFile = path.join(distPath, 'index.html')
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
    next()
  })
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Crop Doctor API is running',
      frontend_dev: 'http://localhost:5173 (run npm run dev)',
      health: '/api/health',
      diagnose: 'POST /api/diagnose',
      chat: 'POST /api/chat',
      note: 'No dist/ found. Run npm run build to generate production frontend, or use vite dev server.',
    })
  })
}

app.listen(port, '0.0.0.0', () => console.log(`Cropwise AI server running on http://0.0.0.0:${port} | vision=${process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL} | chat=${process.env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL} | hasKey=${Boolean(process.env.GROQ_API_KEY)} | dist=${fs.existsSync(distPath) ? 'serving dist/' : 'no dist, API only'}`))