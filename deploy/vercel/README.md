Vercel frontend deployment guide

1) Create a new Vercel project and point it to the `client` folder.

2) Build & Output
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

3) Environment Variables
- `VITE_API_URL`: set to your backend public URL (e.g., https://<server>.up.railway.app)

4) Face-api models
Ensure `client/public/models/face-api` is included in the repo so Vercel will serve the model files (it is present in this repo). If models are large, consider hosting them on a CDN and point `MODEL_BASE_URL` in client config.

5) Post-deploy
- Visit your Vercel URL and verify the client loads and can call the backend APIs.
