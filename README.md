# khataam-orders

Arabic order-collection app for ختعم. React (Vite) on Vercel, Supabase for data.

- `/` enter the code, your name, and quantities. Same name replaces the earlier order.
- `/admin` username/password login, shows the current code and the full summary. Reset wipes all orders and generates a new 6-digit code.

Menu items, prices, and the delivery fee live in the database and are edited from `/admin`. `supabase/schema.sql` is safe to re-run after pulling changes.

## Setup

1. **Supabase**: create a free project, open SQL Editor, run `supabase/schema.sql`.
   From Project Settings → API copy the project URL, the anon (publishable) key, and the service_role (secret) key.
2. **Vercel**: import the repo (framework preset: Vite) and add the env vars from `.env.example`.
3. Open `/admin`, log in, press reset to create the first code.

## Dev

```sh
npm install
npm test              # summary math
npx vercel dev        # runs the app and /api/admin together (plain `npm run dev` has no API)
```
