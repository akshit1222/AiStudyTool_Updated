# StudyForge (AI Study Tool)

Paste notes or upload a PDF and get AI-generated flashcards, quizzes and summaries.
Save sets to your account, then play your own material in **Quiz Blitz** for points,
XP, badges and a place on the leaderboard.

## Run it

```bash
# frontend (http://localhost:5173)
npm install
npm run dev

# backend (http://localhost:5000)
cd backend
npm install
npm run dev
```

`backend/.env` needs `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY` and `CLIENT_URL`
(plus the mail settings used by the OTP flow).

## Pictures and Slides (Generate tab)

- **Pictures:** AI picks the 4 ideas that are easiest to remember visually and draws one picture for each.
  Pictures appear one by one as they finish and can be redrawn or downloaded. If your Gemini key cannot use
  an image model (image models are usually paid), clean diagrams are drawn instead.
  Set `GEMINI_IMAGE_MODEL` in `backend/.env` to change the image model.
- **Slides:** a short 5-7 slide deck with a title slide, speaker notes and a Key takeaways slide.
  Preview it in the app, optionally add a picture to each slide, then download a `.pptx`.
  The file is built in the browser, so it needs no extra server work.

## Look and feel

- **Forgey**, an original anime-style mascot drawn as animated SVG (`components/Mascot.jsx`, seven moods).
  It guides every page with a manga-style speech bubble (`MascotTip.jsx`) and reacts to your answers.
- **Anime loading screen** (`components/Loader.jsx`): speed lines, halftone dots, drifting sparkles, a
  "Now loading" tag, a chapter-style progress bar, rotating messages for each kind of task and study tips.
- **Decorations** (`components/Doodles.jsx`): floating study doodles and slow magic circles fill the side
  space of every page. The summary is a taped notebook page, flashcards sit on a card deck, and quiz
  questions get a Q-number sticker.
- All artwork is code, not images, so it costs no AI quota and loads instantly.

## Speed

- Thinking is set to `minimal` (auto-steps down to `low`, then off, if the model rejects it).
- The item count is decided from the whole notes and split across chunks, so each Gemini call writes only a few
  items, and all calls run at the same time (previously every chunk produced a full set, in two waves).
- Medium notes are split in two parallel calls. Summaries are one call (no combine step).
- Shorter answers/options in prompts, smaller prompts for pictures and slides, 25 s picture timeout before the
  faster SVG fallback, quicker retries. Results are still cached 30 minutes and duplicate requests share one call.
- Set `GEMINI_THINKING_LEVEL=low` or `medium` in `backend/.env` if you prefer deeper reasoning over speed.

## Deploying

- Frontend: set `VITE_API_URL` to your backend URL before `npm run build`.
- Backend: set `NODE_ENV=production` (secure cookies) and `CLIENT_URL` to your frontend URL.
- Never commit `backend/.env`; it is already in `.gitignore`.
