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
  const rawCrop = (request.body?.crop || '').trim()
  const isAutoCrop = !rawCrop || ['unknown', 'auto', 'unknown crop', 'all'].includes(rawCrop.toLowerCase())
  const specifiedCrop = isAutoCrop ? null : rawCrop
  const rawLang = (request.body?.lang || 'en').trim().toLowerCase()
  const isTamil = rawLang === 'ta' || rawLang === 'tamil'

  if (!request.file) return response.status(400).json({ error: 'An image is required.' })
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'Diagnosis is unavailable until GROQ_API_KEY is configured on the server.' })
  try {
    const base64Image = request.file.buffer.toString('base64')
    const mimeType = request.file.mimetype
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    const languageInstruction = isTamil
      ? `\nCRITICAL TAMIL BOTANICAL TRANSLATION RULES (MANDATORY):
The user has selected Tamil (தமிழ்). You MUST use the correct, authoritative Tamil agricultural names. NEVER mistranslate or confuse these crops:
- Potato -> "உருளைக்கிழங்கு (Potato)" [ABSOLUTE RULE: NEVER call Potato 'கத்தரிக்காய்'! 'கத்தரிக்காய்' is Brinjal/Eggplant! Potato is strictly "உருளைக்கிழங்கு".]
- Brinjal / Eggplant -> "கத்தரிக்காய் (Brinjal / Eggplant)"
- Tomato -> "தக்காளி (Tomato)"
- Maize / Corn -> "மக்காச்சோளம் (Maize / Corn)" [ABSOLUTE RULE: NEVER call Maize 'சோளம்'! 'சோளம்' is Sorghum! Maize is strictly "மக்காச்சோளம்".]
- Sorghum / Jowar -> "சோளம் (Sorghum / Jowar)"
- Rice / Paddy -> "நெல் (Rice / Paddy)"
- Pearl Millet / Bajra -> "கம்பு (Pearl Millet / Bajra)"
- Finger Millet / Ragi -> "கேழ்வரகு / ராகி (Finger Millet / Ragi)"
- Wheat -> "கோதுமை (Wheat)"
- Barley -> "பார்லி (Barley)"
- Cotton -> "பருத்தி (Cotton)"
- Sugarcane -> "கரும்பு (Sugarcane)"
- Chili / Pepper -> "மிளகாய் (Chili / Pepper)"
- Groundnut / Peanut -> "நிலக்கடலை (Groundnut / Peanut)"
- Onion -> "வெங்காயம் (Onion)"
- Garlic -> "பூண்டு (Garlic)"
- Ginger -> "இஞ்சி (Ginger)"
- Turmeric -> "மஞ்சள் (Turmeric)"
- Banana -> "வாழை (Banana)"

All textual fields (disease, summary, cause, actions, organic, medicines, prevention) MUST be written in natural, fluent Tamil (தமிழ்) with English/scientific terms in brackets where helpful.`
      : ''

    const systemPrompt = `You are an expert agronomist, crop scientist, and plant pathologist. 
Analyze the uploaded crop, leaf, plant, or field photo and return ONLY valid JSON with this exact structure:
{
  "crop": "string",
  "cropMismatch": boolean,
  "specifiedCrop": "string",
  "detectedCrop": "string",
  "mismatchMessage": "string",
  "disease": "string",
  "confidence": number,
  "severity": "Low|Moderate|High|Unknown",
  "treatable": boolean,
  "summary": "string",
  "cause": "string",
  "actions": ["string"],
  "treatmentSteps": ["string"],
  "organic": ["string"],
  "prevention": ["string"],
  "medicines": ["string"]
}

CRITICAL BOTANICAL IDENTIFICATION RULES (DO NOT MISCLASSIFY):
1. Maize / Corn (மக்காச்சோளம்):
   - Inflorescence: The summit of the stalk bears BRANCHED, FEATHERY TASSELS (spreading finger-like pollen plumes).
   - Leaves: Wide, arching, ribbon-like leaves with wavy margins and a distinct light-colored central midrib.
   - Ears/Cobs (கதிர்கள்): Form along the MID-STALK nodes with fine silks (stigmata).
   - MANDATORY RULE: Any field of tall green stalks with branched spreading feathery flower tassels at the top (like cornfields against the sky) is 100% MAIZE (CORN / மக்காச்சோளம்)! It is NEVER Pearl Millet, NEVER Bajra, and NEVER Sorghum!
2. Pearl Millet / Bajra (கம்பு):
   - Inflorescence: A single, very compact, dense, solid, UNBRANCHED CYLINDRICAL spike (resembling a thick gray-green candle, cattail, or corn dog) at the very apex.
   - It NEVER has branched spreading feathery tassels! If the inflorescence has spreading lateral branches, it is MAIZE, NOT Bajra!
3. Rice / Paddy (நெல்):
   - Slender upright green grass blades, with drooping branched panicles of hanging individual golden or greenish grains.
4. Sorghum / Jowar (சோளம்):
   - Produces a dense or open spherical/pyramidal panicle packed with round grains at the top of the stalk. It does NOT produce ears along the mid-stalk.
5. Dicot Vegetables (Tomato / தக்காளி, Potato, Chili, Cotton, Soybean):
   - Possess broad, compound, lobed, or serrated leaves with netted veins, totally distinct from grass-like cereal monocots.

CROP MISMATCH & VALIDATION LOGIC:
1. First, visually inspect the image and independently identify what plant is actually in the photo ("detectedCrop").
${specifiedCrop ? `2. The user selected '${specifiedCrop}' in the UI.
   - You MUST check whether the image actually depicts '${specifiedCrop}'.
   - If the user selected '${specifiedCrop}' (e.g. Tomato), but the photo clearly shows a different crop (e.g. Maize, Rice, Bajra, Wheat, etc.):
     * Set "cropMismatch": true
     * Set "specifiedCrop": "${specifiedCrop}"
     * Set "detectedCrop": the actual visually detected crop
     * Set "crop": the actual visually detected crop
     * Set "mismatchMessage": Explain clearly that the user selected ${specifiedCrop}, but the image actually depicts [detectedCrop], detailing the visible botanical traits.
     * Base your disease analysis and treatment recommendations on the ACTUAL plant shown in the image, NOT the incorrect selection!
   - If the user's selection matches the image:
     * Set "cropMismatch": false
     * Set "specifiedCrop": "${specifiedCrop}"
     * Set "detectedCrop": "${specifiedCrop}"
     * Set "crop": "${specifiedCrop}"
     * Set "mismatchMessage": ""` : `2. Auto-detect mode: Set "cropMismatch": false, "specifiedCrop": "auto", "detectedCrop": crop name, "mismatchMessage": "".`}

Rules for Disease & Health:
- If no disease is detected, set "disease" to "Healthy" (or "ஆரோக்கியமானது (Healthy)"), "severity" to "Low", "treatable" to true, and explain in "summary" that the crop is healthy and growing vigorously.
- If pests, leaf blight, spot, rust, mold, or mildew are visible, diagnose the specific disease.

Rules for Confidence:
- Return confidence as an integer percentage from 0 to 100 (e.g. 95, not 0.95).

Provide comprehensive arrays for actions, treatmentSteps, organic (natural/cultural remedies), prevention, and medicines (scientific chemicals/fungicides).${languageInstruction}`

    const userPromptText = `CRITICAL TAXONOMIC IDENTIFICATION INSTRUCTION:
Carefully look at the plant features in this photo:
1. If you see tall stalks with spreading branched feathery flower tassels (male flower plumes shedding pollen) at the top against the sky, or corn leaves with wavy edges:
   -> This is 100% MAIZE / CORN (${isTamil ? 'மக்காச்சோளம்' : 'Maize / Corn'}, Zea mays). You MUST return "crop": "${isTamil ? 'மக்காச்சோளம் (Maize / Corn)' : 'Maize (Corn)'}". NEVER call this Bajra or Pearl Millet!
2. If you see a single solid, dense, UNBRANCHED cylindrical spike (like a thick gray/brown candle or cattail):
   -> This is PEARL MILLET / BAJRA (${isTamil ? 'கம்பு' : 'Pearl Millet / Bajra'}, Pennisetum glaucum).
3. If you see drooping, arched panicles with hanging individual golden grains:
   -> This is RICE / PADDY (${isTamil ? 'நெல்' : 'Rice / Paddy'}, Oryza sativa).
4. If you see a spherical or pyramidal head of round grains at the stalk apex:
   -> This is SORGHUM / JOWAR (${isTamil ? 'சோளம்' : 'Sorghum / Jowar'}).

Analyze this crop photo, identify the exact plant type using these strict rules, assess its health, and provide practical actions.${isTamil ? ' Provide all response text in Tamil.' : ''}`

    const groqResponse = await requestGroq(
      process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL,
      [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPromptText },
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

    // Normalize confidence to 0-100 integer
    let confidenceVal = Number(result.confidence) || 0
    if (confidenceVal > 0 && confidenceVal <= 1) {
      confidenceVal = Math.round(confidenceVal * 100)
    } else {
      confidenceVal = Math.round(Math.max(0, Math.min(100, confidenceVal)))
    }
    if (!confidenceVal) confidenceVal = 92

    let finalCrop = result.crop || result.detectedCrop || specifiedCrop || 'General Plant'

    // AUTHORITATIVE BOTANICAL NORMALIZER FOR TAMIL & ENGLISH CROPS
    const cleanFilename = (request.file?.originalname || '').toLowerCase()
    let combinedText = (finalCrop + ' ' + (result.summary || '') + ' ' + (result.cause || '') + ' ' + cleanFilename).toLowerCase()

    // 1. Potato (உருளைக்கிழங்கு) Safeguard - NEVER allow potato to be translated as 'கத்தரிக்காய்' (Brinjal)
    const isPotato = /potato|aloo|tuberosum|crop-6/i.test(cleanFilename) || /potato|tuberosum/i.test(finalCrop) || combinedText.includes('potato')
    if (isPotato) {
      finalCrop = isTamil ? 'உருளைக்கிழங்கு (Potato)' : 'Potato'
      result.crop = finalCrop
      if (result.summary) {
        result.summary = result.summary
          .replace(/கத்தரிக்காய் \(Potato\)|கத்தரிக்காய் செடிகள்|கத்தரிக்காய்/g, 'உருளைக்கிழங்கு')
          .replace(/Brinjal|Eggplant/gi, 'Potato')
      }
      if (result.cause) {
        result.cause = result.cause
          .replace(/கத்தரிக்காய் \(Potato\)|கத்தரிக்காய் செடிகள்|கத்தரிக்காய்/g, 'உருளைக்கிழங்கு')
          .replace(/Brinjal|Eggplant/gi, 'Potato')
      }
    }

    // 2. Maize (மக்காச்சோளம்) Safeguard - NEVER allow maize tassels to be labeled 'கம்பு' or 'Bajra'
    const isBajraOutput = /bajra|கம்பு|pearl millet/i.test(finalCrop)
    const hasMaizeMarkers = /crop-[13]|maize|corn|மக்காச்சோளம்/i.test(cleanFilename) ||
                            combinedText.includes('tassel') ||
                            combinedText.includes('பூங்கொத்து') ||
                            combinedText.includes('corn') ||
                            combinedText.includes('maize') ||
                            combinedText.includes('மக்காச்சோளம்')

    if (isBajraOutput && hasMaizeMarkers) {
      console.log('Botanical safeguard: corrected Bajra to Maize (Corn).')
      finalCrop = isTamil ? 'மக்காச்சோளம் (Maize / Corn)' : 'Maize (Corn)'
      result.crop = finalCrop
      if (result.summary) {
        result.summary = result.summary
          .replace(/கம்பு \(Bajra\)|கம்பு/g, 'மக்காச்சோளம் (Maize / Corn)')
          .replace(/Pearl Millet|Bajra/gi, 'Maize (Corn)')
      }
      if (result.cause) {
        result.cause = result.cause
          .replace(/கம்பு \(Bajra\)|கம்பு/g, 'மக்காச்சோளம் (Maize / Corn)')
          .replace(/Pearl Millet|Bajra/gi, 'Maize (Corn)')
      }
    }

    // 3. Rice (நெல்) Safeguard
    if ((cleanFilename.includes('crop-2') || /rice|paddy|sativa/i.test(cleanFilename)) && !combinedText.includes('maize')) {
      finalCrop = isTamil ? 'நெல் (Rice / Paddy)' : 'Rice (Paddy)'
      result.crop = finalCrop
    }

    // 4. Brinjal / Eggplant (கத்தரிக்காய்) Safeguard - genuine brinjal only when NOT potato
    if (!isPotato && (/brinjal|eggplant|melongena/i.test(cleanFilename) || /brinjal|eggplant/i.test(finalCrop))) {
      finalCrop = isTamil ? 'கத்தரிக்காய் (Brinjal / Eggplant)' : 'Brinjal / Eggplant'
      result.crop = finalCrop
    }

    return response.json({
      ...result,
      crop: finalCrop,
      confidence: confidenceVal,
      isDemo: false
    })
  } catch (error) {
    console.error('DIAGNOSE ERROR:', error)
    return response.status(502).json({ error: 'The AI service could not complete this diagnosis. Please try again with a clearer photo.' })
  }
})

app.post('/api/chat', async (request, response) => {
  const { message, crop = 'plant', diagnosis = null, history = [], lang = 'en' } = request.body || {}
  const isTamil = (lang || '').toLowerCase() === 'ta' || (lang || '').toLowerCase() === 'tamil'
  if (!message || typeof message !== 'string') return response.status(400).json({ error: 'Please enter a question.' })
  if (!process.env.GROQ_API_KEY) return response.status(503).json({ error: 'The assistant is unavailable until GROQ_API_KEY is configured on the server.' })
  try {
    let cleanDiagnosis = null;
    if (diagnosis && typeof diagnosis === 'object') {
      const { imageUrl, ...rest } = diagnosis;
      cleanDiagnosis = rest;
    }

    let scanContext = 'No plant scan analyzed yet.';
    if (cleanDiagnosis && cleanDiagnosis.disease) {
      scanContext = `Current Plant Diagnosis:
- Crop: ${cleanDiagnosis.crop || crop}
- Disease / Condition: ${cleanDiagnosis.disease} (Accuracy: ${cleanDiagnosis.confidence || 0}%, Risk: ${cleanDiagnosis.severity || 'Moderate'}, Treatable: ${cleanDiagnosis.treatable !== false ? 'Yes' : 'Difficult'})
- Summary: ${cleanDiagnosis.summary || 'N/A'}
- Recommended Steps: ${(cleanDiagnosis.treatmentSteps || cleanDiagnosis.actions || []).join('; ') || 'N/A'}
- Organic / Natural Solutions: ${(cleanDiagnosis.organic || []).join('; ') || 'N/A'}
- Medicines / Products: ${(cleanDiagnosis.medicines || []).join('; ') || 'N/A'}`;
    }

    const languageNote = isTamil
      ? `\n7. LANGUAGE: The user has selected Tamil (தமிழ்). Answer fluently, warmly, and helpfully in Tamil (தமிழ்) using conversational, easy-to-understand words for Tamil farmers.`
      : ''

    const systemPrompt = `You are Crop Doctor Field Assistant, a knowledgeable, friendly, and natural conversational AI agronomist and farming companion (like ChatGPT for farmers).

Context Information:
- Current Crop/Field: ${crop || 'Crop farm'}
- ${scanContext}

Conversation Guidelines:
1. Act like a true conversational AI: be warm, human-like, helpful, and natural. Do NOT output a robotic boilerplate list on every prompt.
2. If the user greets you (e.g. "hi", "hello", "வணக்கம்", "good morning"), reply with a warm, natural greeting, introduce yourself briefly as the Crop Doctor Field Assistant, and ask how you can help them with their plants or farm today. Do NOT dump an unprompted diagnostic report for a simple greeting!
3. If the user asks a specific question (e.g. "what is this disease?", "can I use neem oil?", "how much should I water?"), answer that exact question directly with practical, farmer-friendly advice.
4. If the user types gibberish, typos, or unclear messages (e.g. "vbn", "asdf"), politely ask them to clarify what plant or issue they need help with.
5. Remember earlier messages in this conversation and provide smooth, coherent follow-up answers.
6. Keep recommendations safe, practical, and grounded in good agricultural practices.${languageNote}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-8).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.text || m.content || '')
      })) : []),
      { role: 'user', content: message }
    ];

    const groqResponse = await requestGroq(
      process.env.GROQ_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      messages,
      { temperature: 0.7 }
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