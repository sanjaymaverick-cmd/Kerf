# Kerf

Two bins. One cut.

Dual-bin inventory for a woodworking **spares and tools** trader.

Sister concern imports the machines. The tooling that rides with those machines is sold across in partnership — that is **Billed**. China still throws complimentary spares in the crate with no bill — that is **Ghost**. Kerf holds both, and deducts when stock leaves.

**Kerf is the book.** Tally is a feed. Cash is a feed. The shelf, the rupees, and the ledger live here.

**Billed** — partnership transfers from the sister mill, plus anything bought on invoice. Mirror Tally via manual entry or Tally Prime XML export.

**Ghost** — complimentary spares. Sold in cash. Never on Tally. Tracked here.

## What it does

- Stock in: partnership / purchase → billed, complimentary crate extras → ghost
- Stock out: cash sale → ghost, Tally sale → billed
- Tally XML import (sales / purchase vouchers) — re-import is safe, duplicates skipped
- Dual-qty shelf, low-stock, ledger, INR throughout
- Export book (JSON) from the ledger

## Stack

TanStack Start, Postgres (Neon on Vercel, PGLite on USB / preview), Better Auth (Google, X, email).

## Local

```bash
npm install
npm run dev
```

Sign in, then the floor loads a sample spares-and-tools workshop.

## Vercel (test deploy)

The build already emits Vercel output (`nitro` preset `vercel`, `vercel.json` pinned to Mumbai `bom1`).

1. Push the repo to GitHub.
2. [Import the project on Vercel](https://vercel.com/new).
3. Set these **Production** env vars:

| Var | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (required — serverless cannot keep an in-memory book) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://<your-app>.vercel.app` |
| `VITE_AUTH_ENABLED` | `true` |

Email sign-up works without Google. Optional: `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET` if you wire the broker.

`KERF_SEED` defaults on, so the first login gets the sample shelf. Set `KERF_SEED=0` once you are on live stock.

Do **not** skip `DATABASE_URL` on Vercel. Without it the book evaporates on every cold start.

## USB stick (Windows shop PC)

Kerf can sit on a pendrive. The book lives in a `data` folder next to the launcher — copy the folder, copy the book.

On the Windows machine that has this repo (PowerShell):

```powershell
cd "D:\work Dir\Kerf"
npm install
npm run build:stick
```

`npm install` is required first. `build:stick` uses the local Vite — do not answer `y` if `npx` asks to download Vite.

That writes `dist-stick\Kerf\`. Copy that folder onto the USB.

Then on the shop PC:

1. Download [Node 22 Windows x64](https://nodejs.org) zip.
2. Put `node.exe` in `Kerf\node\node.exe`.
3. Double-click `Kerf.bat`.
4. Sign up with email. Sample stock is off (`KERF_SEED=0`).

Leave the window open while you work. Close it to stop Kerf.

This is not an `.exe` installer and does not need admin rights. It is a portable folder.

## Tally XML

Gateway of Tally → Export, or Alt+E from a voucher list. Sales and purchase vouchers with inventory lines. UTF-8 or UTF-16. Kerf matches by Tally name, SKU, or item name. Unknown items are created. Short billed qty is posted and flagged. Same file twice → already-posted vouchers skipped.
