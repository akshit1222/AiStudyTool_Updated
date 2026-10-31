// AI pictures and slide outlines built from study notes.
const { askGemini, retryDelaySeconds, parseJsonResponse, memo, cacheKey, condense } = require('./geminiHelper');

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite-image';
const IMAGE_TIMEOUT_MS = 25000; // slower than this and a drawn diagram is quicker anyway

// If the image API says "not available for this key" we skip it for a while and draw SVGs instead.
let imageApiBlockedUntil = 0;

const STYLE =
  'Clean modern flat educational illustration, bold simple shapes, soft violet, magenta and orange palette on a dark navy background, ' +
  'one clear focal subject, generous empty space, no text, no letters, no numbers, no watermark.';

function arrayFrom(data, key) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  throw new Error(`Expected an array of ${key}`);
}

// ---------------------------------------------------------------------------
// Visuals
// ---------------------------------------------------------------------------
function planVisuals(text, count = 4) {
  const n = Math.max(1, Math.min(6, count));
  return memo(cacheKey('visual-plan', n, text), async () => {
    const prompt = `Read these study notes and choose the ${n} most important ideas that a picture would help someone remember.
For each, write:
- "title": 2 to 6 words
- "caption": one plain sentence (max 22 words) explaining what the picture shows
- "prompt": a vivid description of ONE simple illustration that explains the idea visually (describe objects, layout and relationships; no text in the image)
Return ONLY a raw JSON array: [{"title":"...","caption":"...","prompt":"..."}]
Notes: ${condense(text, 7000)}`;

    const raw = await askGemini(prompt, { json: true });
    const items = arrayFrom(parseJsonResponse(raw), 'items')
      .filter((i) => i && typeof i.title === 'string' && typeof i.prompt === 'string')
      .slice(0, n)
      .map((i) => ({
        title: i.title.trim(),
        caption: typeof i.caption === 'string' ? i.caption.trim() : '',
        prompt: i.prompt.trim(),
      }));

    if (items.length === 0) throw new Error('No visual concepts were returned');
    return items;
  });
}

async function generateRasterImage(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\nStyle: ${STYLE} Wide 16:9 composition.` }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = new Error(`Image API ${response.status}: ${body.slice(0, 200)}`);
      error.status = response.status;
      try {
        error.errorDetails = JSON.parse(body)?.error?.details;
      } catch {
        /* body was not JSON */
      }
      throw error;
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => (p.inlineData || p.inline_data) && !p.thought);
    const inline = imagePart && (imagePart.inlineData || imagePart.inline_data);
    if (!inline?.data) throw new Error('Image API returned no image');

    const mime = inline.mimeType || inline.mime_type || 'image/png';
    return `data:${mime};base64,${inline.data}`;
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/(xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, '');
}

async function generateSvgImage(title, prompt) {
  const request = `Draw a clean, flat-style educational illustration as a single SVG.
Topic: ${title}. Scene: ${prompt}
Rules:
- viewBox="0 0 800 450", no width/height attributes, a dark navy (#0f0d1f) background rectangle first.
- Palette: #7c3aed, #a78bfa, #f0abfc, #ff7a3d, #fbbf24, #38bdf8, #34d399 and white.
- Use simple shapes, gradients, arrows and icons. At most 3 short text labels of 1-3 words.
- No scripts, no external images, no fonts other than sans-serif.
Return ONLY the <svg>...</svg> markup.`;

  const raw = await askGemini(request);
  const match = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) throw new Error('No SVG returned');
  const svg = sanitizeSvg(match[0]);
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

function generateVisualImage(title, prompt) {
  return memo(cacheKey('visual-image', IMAGE_MODEL, title, prompt), async () => {
    if (Date.now() >= imageApiBlockedUntil) {
      try {
        return { image: await generateRasterImage(prompt), kind: 'image' };
      } catch (error) {
        const permanent = [400, 401, 403, 404].includes(error.status);
        if (error.status === 429) {
          // Image quota is used up (often zero on the free tier): skip the image model for a while.
          const seconds = retryDelaySeconds(error) || 60;
          imageApiBlockedUntil = Date.now() + Math.min(seconds, 3600) * 1000;
          console.warn('Image model quota reached; drawing SVG illustrations instead.');
        } else if (permanent) {
          imageApiBlockedUntil = Date.now() + 10 * 60 * 1000;
          console.warn(`Image model unavailable (${error.message}); drawing SVG illustrations instead.`);
        } else {
          console.warn(`Image generation failed (${error.message}); drawing an SVG instead.`);
        }
      }
    }
    return { image: await generateSvgImage(title, prompt), kind: 'svg' };
  });
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------
function generateSlideOutline(text) {
  return memo(cacheKey('slides', text), async () => {
    const prompt = `Turn these study notes into a SHORT presentation: 5 to 7 content slides.
The last slide must be "Key takeaways". Do not include a separate title slide.
Return ONLY raw JSON in this shape:
{"title":"deck title (max 8 words)","subtitle":"one short line","slides":[{"title":"max 8 words","bullets":["max 14 words each, 2 to 4 bullets"],"notes":"1-2 sentence speaker note","imagePrompt":"a simple illustration idea for this slide, no text in the image"}]}
Notes: ${condense(text, 10000)}`;

    const raw = await askGemini(prompt, { json: true });
    const data = parseJsonResponse(raw);

    const slides = (Array.isArray(data?.slides) ? data.slides : [])
      .filter((s) => s && typeof s.title === 'string' && Array.isArray(s.bullets))
      .slice(0, 8)
      .map((s) => ({
        title: s.title.trim(),
        bullets: s.bullets.filter((b) => typeof b === 'string' && b.trim()).map((b) => b.trim()).slice(0, 5),
        notes: typeof s.notes === 'string' ? s.notes.trim() : '',
        imagePrompt: typeof s.imagePrompt === 'string' ? s.imagePrompt.trim() : s.title.trim(),
      }))
      .filter((s) => s.bullets.length > 0);

    if (slides.length === 0) throw new Error('No slides were returned');

    return {
      title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Study Notes',
      subtitle: typeof data.subtitle === 'string' ? data.subtitle.trim() : '',
      slides,
    };
  });
}

module.exports = { planVisuals, generateVisualImage, generateSlideOutline };
