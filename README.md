# khataam-orders

Arabic order-collection app for ختعم. React (Vite) on Vercel, Supabase for data.

- `/` enter the code, your name, and quantities. Same name replaces the earlier order.
- `/admin` username/password login, shows the current code and the full summary. Reset wipes all orders, generates a new 6-digit code, and emails it.

Menu, prices, and delivery fee live in `src/menu.js` (item ids are also whitelisted in `supabase/schema.sql`).

## Setup

1. **Supabase**: create a free project, open SQL Editor, run `supabase/schema.sql`.
   From Project Settings → API copy the project URL, the anon (publishable) key, and the service_role (secret) key.
2. **Gmail**: enable 2-Step Verification, then create an App Password at https://myaccount.google.com/apppasswords.
3. **Vercel**: import the repo (framework preset: Vite) and add the env vars from `.env.example`.
4. Open `/admin`, log in, press reset to create the first code.

## Dev

```sh
npm install
npm test              # summary math
npx vercel dev        # runs the app and /api/admin together (plain `npm run dev` has no API)
```
