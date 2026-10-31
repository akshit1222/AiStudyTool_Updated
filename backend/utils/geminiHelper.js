const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// "minimal" thinking is the fastest and plenty for turning notes into cards and quizzes.
// If the model rejects it we automatically step down: minimal -> low -> not sent.
// Set GEMINI_THINKING_LEVEL=low/medium/high in .env for deeper reasoning, or "off" to not send it.
const THINKING_LEVEL = (process.env.GEMINI_THINKING_LEVEL || 'budget0').toLowerCase();

const RPM = Number(process.env.GEMINI_RPM || 5); // requests per minute your key allows
const CHUNK_SIZE = 12000;
const SAMPLE_SIZE = 16000; // low-rate keys: one call over an even sample of the whole notes
const CHUNK_OVERLAP = 500;
const MAX_CHUNKS = RPM >= 30 ? 3 : 1; // very long notes are sampled evenly instead of processed in full
const CONCURRENCY = MAX_CHUNKS; // all chunks go to Gemini at the same time
const RETRY_DELAYS_MS = [400, 1000, 2000, 4000];

// ---------------------------------------------------------------------------
// Model access
// ---------------------------------------------------------------------------
let thinkingLevel = THINKING_LEVEL === 'off' || THINKING_LEVEL === 'default' ? null : THINKING_LEVEL;
// Models that reject thinkingLevel often accept a zero thinking budget, which is also the fastest setting.
const NEXT_THINKING = { budget0: 'minimal', minimal: 'low', low: null, medium: null, high: null };
const modelCache = new Map();

// ---------------------------------------------------------------------------
// Rate limiter: free keys allow only a few requests per minute. Waiting for a slot is far cheaper than
// sending a request that is rejected with 429 (which still wastes a call and then forces a long retry).
// Set GEMINI_RPM to your model's limit (free tier is often 5-15, paid keys 1000+).
// ---------------------------------------------------------------------------
const stamps = new Map(); // model -> start times of calls in the last minute

function slotWaitMs(name) {
  const now = Date.now();
  const list = (stamps.get(name) || []).filter((t) => now - t < 60000);
  stamps.set(name, list);
  return list.length < RPM ? 0 : list[0] + 60000 - now + 50;
}

async function takeSlot(name) {
  for (;;) {
    const wait = slotWaitMs(name);
    if (wait <= 0) {
      stamps.get(name).push(Date.now());
      return;
    }
    await new Promise((r) => setTimeout(r, wait));
  }
}

// With a fallback model, use whichever model has a free slot right now: doubles the usable rate.
async function pickModel() {
  if (FALLBACK_MODEL && slotWaitMs(MODEL_NAME) > 0 && slotWaitMs(FALLBACK_MODEL) <= 0) return FALLBACK_MODEL;
  return MODEL_NAME;
}

const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || '';

function getModel({ json, name = MODEL_NAME }) {
  const key = `${name}:${json}:${thinkingLevel}`;
  if (modelCache.has(key)) return modelCache.get(key);

  const generationConfig = {};
  if (json) generationConfig.responseMimeType = 'application/json';
  if (thinkingLevel === 'budget0') generationConfig.thinkingConfig = { thinkingBudget: 0 };
  else if (thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel };

  const model = genAI.getGenerativeModel({ model: name, generationConfig });
  modelCache.set(key, model);
  return model;
}

function isRetryableError(error) {
  const message = (error?.message || '').toLowerCase();
  const status = error?.status;
  return (
    status === 429 ||
    status === 503 ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('rate limit') ||
    message.includes('overloaded') ||
    message.includes('unavailable')
  );
}

function isThinkingConfigError(error) {
  const message = (error?.message || '').toLowerCase();
  return (error?.status === 400 || message.includes('400')) && message.includes('thinking');
}

// Google reports "retry after N seconds" in errorDetails (RetryInfo) or in the message text.
function retryDelaySeconds(error) {
  const details = Array.isArray(error?.errorDetails) ? error.errorDetails : [];
  const info = details.find((d) => String(d?.['@type'] || '').endsWith('RetryInfo'));
  const fromDetails = parseFloat(info?.retryDelay);
  if (Number.isFinite(fromDetails)) return fromDetails;
  const match = /retry in ([\d.]+)s/i.exec(error?.message || '');
  return match ? parseFloat(match[1]) : null;
}

const MAX_WAIT_SECONDS = 75; // per-minute limits clear within about a minute; hours-long hints are daily quotas

// Turns a Gemini error into a status code and a message that is useful to the person using the app.
function friendlyGeminiError(error, fallback) {
  if (error?.status === 429 || error?.quotaExhausted) {
    const seconds = error.retryAfterSec ?? retryDelaySeconds(error);
    let when = 'in a minute';
    if (seconds && seconds > 90) {
      const hours = seconds / 3600;
      when = hours >= 1.5 ? `in about ${Math.round(hours)} hours` : `in about ${Math.ceil(seconds / 60)} minutes`;
    }
    return {
      status: 429,
      message: `Gemini usage limit reached. It resets ${when}. You can also set a different GEMINI_MODEL in backend/.env or enable billing in Google AI Studio.`,
    };
  }
  if (error?.status === 503 || /overloaded|unavailable/i.test(error?.message || '')) {
    return { status: 503, message: 'Gemini is busy right now. Please try again in a moment.' };
  }
  return { status: 500, message: fallback };
}

// A call that is still silent after HEDGE_MS gets one duplicate; whichever answers first wins.
// This cuts the long tail (a stuck or slow call) without slowing down normal calls.
const HEDGE_MS = RPM >= 30 ? Number(process.env.GEMINI_HEDGE_MS || 15000) : 0; // 0 = off on low-rate keys

function hedged(start) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let started = 1;
    let failures = 0;
    let timer;
    const done = (fn, v) => { if (settled) return; settled = true; clearTimeout(timer); fn(v); };
    const fail = (e) => { if (++failures >= started && !timer._pending) done(reject, e); };
    if (!HEDGE_MS) { start().then(resolve, reject); return; }
    timer = setTimeout(() => {
      timer._pending = false;
      if (settled) return;
      started++;
      console.warn('[gemini] slow call, sending a backup request');
      start().then((v) => done(resolve, v), fail);
    }, HEDGE_MS);
    timer._pending = true;
    // An early failure goes straight to the retry logic instead of waiting for the backup timer.
    start().then((v) => done(resolve, v), (e) => { if (timer._pending) done(reject, e); else fail(e); });
  });
}

async function askGemini(prompt, { json = false } = {}) {
  try {
    return await askModel(prompt, { json, name: await pickModel() });
  } catch (error) {
    // Daily quota used up on the main model: a different model has its own quota.
    if (error?.quotaExhausted && FALLBACK_MODEL) {
      console.warn(`Quota reached on ${MODEL_NAME}; using ${FALLBACK_MODEL}.`);
      return askModel(prompt, { json, name: FALLBACK_MODEL });
    }
    throw error;
  }
}

async function askModel(prompt, { json = false, name = MODEL_NAME } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await takeSlot(name);
      const t0 = Date.now();
      const text = await hedged(() => getModel({ json, name }).generateContent(prompt).then((r) => r.response.text()));
      console.log(`[gemini] ${name} think=${thinkingLevel || 'default'} ${Date.now() - t0}ms in=${prompt.length} out=${text.length}`);
      return text;
    } catch (error) {
      lastError = error;

      // This model rejected the thinking setting: stop sending it and try again straight away.
      if (thinkingLevel && isThinkingConfigError(error)) {
        const stepped = NEXT_THINKING[thinkingLevel] ?? null;
        console.warn(`Gemini rejected thinking setting "${thinkingLevel}"; ${stepped ? `trying "${stepped}"` : 'continuing without it'}. (${String(error?.message || '').slice(0, 160)})`);
        thinkingLevel = stepped;
        attempt -= 1;
        continue;
      }

      if (!isRetryableError(error) || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      // A quota that resets in hours will not clear by retrying: fail fast with a clear error.
      const hinted = error?.status === 429 ? retryDelaySeconds(error) : null;
      if (hinted !== null && hinted > MAX_WAIT_SECONDS) {
        error.quotaExhausted = true;
        error.retryAfterSec = hinted;
        throw error;
      }
      const waitMs = hinted !== null ? Math.ceil(hinted * 1000) + 250 : RETRY_DELAYS_MS[attempt];
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// Cache and duplicate-request protection
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 80;
const cache = new Map();
const inflight = new Map();

function cacheKey(...parts) {
  return crypto.createHash('sha1').update(parts.join('\u0001')).digest('hex');
}

// Same notes + same options returns instantly; identical simultaneous requests share one call.
function memo(key, producer) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  if (inflight.has(key)) return inflight.get(key);

  const promise = producer()
    .then((value) => {
      cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
      if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
      return value;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function splitIntoChunks(text) {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

function sampleEvenly(list, max) {
  if (list.length <= max) return list;
  const picked = [];
  for (let i = 0; i < max; i++) {
    picked.push(list[Math.round((i * (list.length - 1)) / (max - 1))]);
  }
  return picked;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// Even sample of the whole notes (start, middle and end) so one call still covers everything.
function sampleText(text, max) {
  if (text.length <= max) return text;
  const part = Math.floor(max / 4);
  const mids = [0.33, 0.66].map((f) => Math.floor(text.length * f - part / 2));
  return [text.slice(0, part), text.slice(mids[0], mids[0] + part), text.slice(mids[1], mids[1] + part), text.slice(-part)].join('\n[...]\n');
}

// Shortens very long notes for tasks that only need the gist (visual plans, slide outlines).
function condense(text, max = 9000) {
  if (text.length <= max) return text;
  const half = Math.floor(max / 2);
  return `${text.slice(0, half)}\n[...]\n${text.slice(-half)}`;
}

function parseJsonResponse(raw) {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse JSON response: ${raw.slice(0, 200)}`);
  }
}

function validateFlashcards(data) {
  if (!Array.isArray(data)) {
    throw new Error('Expected flashcards response to be an array');
  }
  for (const card of data) {
    if (typeof card?.question !== 'string' || typeof card?.answer !== 'string') {
      throw new Error('Malformed flashcard: each item must have question and answer strings');
    }
  }
  return data;
}

function validateQuiz(data) {
  if (!Array.isArray(data)) {
    throw new Error('Expected quiz response to be an array');
  }
  for (const item of data) {
    if (
      typeof item?.question !== 'string' ||
      !Array.isArray(item?.options) ||
      item.options.length !== 4 ||
      typeof item?.correct !== 'number'
    ) {
      throw new Error('Malformed quiz item: expected question, 4 options, and correct index');
    }
  }
  return data;
}

function deduplicateByQuestion(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getFlashcardCount(textLength) {
  if (textLength < 1000) return 5;
  if (textLength < 3000) return 10;
  if (textLength < 6000) return 15;
  if (textLength < 12000) return 20;
  return 25;
}

function getQuizCount(textLength) {
  if (textLength < 1000) return 5;
  if (textLength < 3000) return 10;
  if (textLength < 6000) return 15;
  if (textLength < 12000) return 20;
  return 25;
}

// With an explicit target (the game asks for ~10) use fewer chunks so the answer comes back sooner.
// The TOTAL number of items comes from the whole text and is split across chunks, so every call
// writes only a few items (output length is what takes the time) and all calls run in parallel.
function planChunks(text, count, getDefaultCount) {
  let all = RPM >= 30 ? splitIntoChunks(text) : [sampleText(text, SAMPLE_SIZE)];
  const total = count || Math.min(getDefaultCount(text.length), 25);
  // A medium-sized note still gets two parallel calls (one per half) when many items are wanted.
  if (RPM >= 30 && all.length === 1 && total >= 10 && text.length >= 1500) {
    const mid = text.indexOf('\n', Math.floor(text.length / 2));
    const cut = mid > 0 && mid < text.length * 0.7 ? mid : Math.floor(text.length / 2);
    all = [text.slice(0, cut), text.slice(cut)];
  }
  const used = sampleEvenly(all, Math.min(count ? 2 : MAX_CHUNKS, all.length, Math.ceil(total / 4)));
  return { chunks: used, perChunk: Math.max(3, Math.ceil(total / used.length)), total };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------
async function generateFlashcardsFromChunk(text, countOverride) {
  const count = countOverride || getFlashcardCount(text.length);
  const prompt = `Convert the following study notes into exactly ${count} flashcards.
- Cover the most important concepts, definitions, and facts.
- Each flashcard tests one distinct concept. Keep answers short (max 30 words).
Return ONLY a raw JSON array. No markdown, no explanation, no code fences.
Format: [{"question": "...", "answer": "..."}]
Notes: ${text}`;

  const raw = await askGemini(prompt, { json: true });
  return validateFlashcards(parseJsonResponse(raw));
}

async function generateQuizFromChunk(text, countOverride) {
  const count = countOverride || getQuizCount(text.length);
  const prompt = `Create exactly ${count} multiple choice questions from the following notes.
- Cover the most important concepts spread across the entire content.
- Mix recall, comprehension and application. Make all 4 options plausible but SHORT (max 12 words each).
Return ONLY a raw JSON array. No markdown, no explanation, no code fences.
Each item: {"question":"...","options":["A","B","C","D"],"correct":0}
'correct' is the 0-based index of the right answer.
Notes: ${text}`;

  const raw = await askGemini(prompt, { json: true });
  return validateQuiz(parseJsonResponse(raw));
}

async function generateSummaryFromChunk(text) {
  const prompt = `Write a concise TL;DR summary (5-8 bullet points) of the following notes.
Return plain text only. No markdown headers. Use • as bullet character.
Notes: ${text}`;

  return askGemini(prompt);
}

function generateFlashcards(text, { count } = {}) {
  return memo(cacheKey('flashcards', MODEL_NAME, count || '', text), async () => {
    const { chunks, perChunk, total } = planChunks(text, count, getFlashcardCount);
    const results = await mapLimit(chunks, CONCURRENCY, (chunk) =>
      generateFlashcardsFromChunk(chunk, perChunk)
    );
    return deduplicateByQuestion(results.flat()).slice(0, total);
  });
}

function generateQuiz(text, { count } = {}) {
  return memo(cacheKey('quiz', MODEL_NAME, count || '', text), async () => {
    const { chunks, perChunk, total } = planChunks(text, count, getQuizCount);
    const results = await mapLimit(chunks, CONCURRENCY, (chunk) =>
      generateQuizFromChunk(chunk, perChunk)
    );
    return deduplicateByQuestion(results.flat()).slice(0, total);
  });
}

function generateSummary(text) {
  // One call over an even sample of the notes: no chunk-then-combine second round trip.
  return memo(cacheKey('summary', MODEL_NAME, text), () => generateSummaryFromChunk(condense(text, 16000)));
}

module.exports = {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  // shared with utils/studyExtras.js
  askGemini,
  retryDelaySeconds,
  friendlyGeminiError,
  parseJsonResponse,
  memo,
  cacheKey,
  condense,
  mapLimit,
};
