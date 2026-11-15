# Setup

```bash
npm create vite@latest dev-forum-frontend -- --template react-ts
cd dev-forum-frontend

npm install lucide-react socket.io-client
npm install -D tailwindcss postcss autoprefixer
```

Copy `.env.example` to `.env` and point it at your running backend
(defaults assume `http://localhost:3000`).

```bash
npm run dev
```

## Notes

- `App.tsx` uses a `CURRENT_USER_ID` placeholder and reads a bearer token
  from `localStorage.getItem('accessToken')` (see `src/lib/api.ts`) —
  wire these up to your real login flow once it exists.
- The comments modal in `App.tsx` and the chat drawer in `ChatDrawer.tsx`
  are intentionally decoupled: opening one doesn't close the other, so a
  user can have a post's comments open and request a chat about it at the
  same time.
