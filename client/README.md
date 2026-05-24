# Client — AI Interview Prep (Stage 1)

Install and run:

```bash
cd client
npm install
npm run dev
```

Set `VITE_API_URL` in `.env` if backend runs on a different host.

Stage 2 pages:
- `/dashboard` — analytics-driven dashboard
- `/analytics` — performance charts and leaderboard
- `/coding` — Monaco coding assessment lab
- `/ai` — AI question generation

Stage 3 camera setup:
- Place the face-api.js weight files in `client/public/models/face-api/`
- The app loads models from `/models/face-api` by default
- Supported models: `tiny_face_detector`, `face_landmark_68`, and `face_expression`
- If the models fail to load, the interview falls back to heuristic camera scoring so the flow still works
- You can override the asset path with `VITE_FACE_API_MODEL_URL` in `.env`

Recommended model files:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`
