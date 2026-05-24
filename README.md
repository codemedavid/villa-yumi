# Villa Yumi — direct booking site

A simple, single-villa booking website with manual **GCash** payment and a
password-protected owner page. Guests pick dates, pay via GCash, and the owner
confirms bookings from `/admin`.

Built with Next.js 15 (App Router), TypeScript, Tailwind, and Supabase
(`@supabase/supabase-js`). No Prisma, no multi-tenant accounts.

## Pages
- `/` — villa landing, photo gallery, details, and the booking calendar.
- `/book` — checkout: guest details + GCash payment (QR/number) + reference upload.
- `/booking/success` — confirmation with code.
- `/admin` — owner page (password): view/confirm/cancel bookings, set price + GCash details.

## Setup

### 1. Database (one time)
Open **Supabase → SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and Run. This creates the `bookings` and `settings` tables and a public `villa-public` storage bucket (for the QR + payment screenshots).

### 2. Environment
You already have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
The only thing to add to `.env` is your admin password:

```bash
ADMIN_PASSWORD=...   # your password for /admin
```

Supabase is accessed only from the server using the anon key, combined with the
RLS policies in `supabase/schema.sql`. No service-role secret needed.

### 3. Run
```bash
npm install
npm run dev
```

Then:
1. Go to `/admin`, log in, set your nightly price + GCash number, and upload your QR.
2. On `/`, pick dates → **Reserve** → pay via GCash → submit. The booking shows up in `/admin` as **pending** for you to confirm.

## Editing villa content
Photos, description, amenities, and location live in [`src/lib/villa.ts`](src/lib/villa.ts).
Price and GCash details are editable from `/admin` (stored in the `settings` table).
# villa-yumi
