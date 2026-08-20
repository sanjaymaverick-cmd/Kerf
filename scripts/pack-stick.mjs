#!/usr/bin/env node
/**
 * Packs the KERF_STICK node-server build into dist-stick/Kerf/
 * so the folder can be copied onto a USB drive and run on Windows.
 *
 * Expected after `KERF_STICK=1 vite build`:
 *   .output/server/index.mjs  (nitro node-server)
 *   .output/public
 *
 * Drop a portable Node next to it:
 *   dist-stick/Kerf/node/node.exe
 * Download: https://nodejs.org/dist/v22.18.0/node-v22.18.0-win-x64.zip
 * Extract node.exe into that node/ folder.
 */
import { cp, mkdir, readdir, rm, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-stick", "Kerf");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function findServerEntry(base) {
  const candidates = [
    join(base, "server", "index.mjs"),
    join(base, "server", "index.js"),
    join(base, "index.mjs"),
  ];
  return candidates;
}

const bat = `@echo off
setlocal
cd /d "%~dp0"
title Kerf
set KERF_STICK=1
set KERF_DATA_DIR=%~dp0data\\pglite
set KERF_SEED=0
set PORT=4780
set HOST=127.0.0.1
set BETTER_AUTH_URL=http://127.0.0.1:4780
if not exist "node\\node.exe" (
  echo.
  echo  Kerf needs a portable Node next to this folder.
  echo  Put node.exe in:
  echo    %~dp0node\\node.exe
  echo.
  echo  Download Node 22 Windows x64 zip from nodejs.org,
  echo  extract node.exe into that node folder, and run Kerf again.
  echo.
  pause
  exit /b 1
)
if not exist "data" mkdir data
echo.
echo  Kerf is opening on http://127.0.0.1:4780
echo  Leave this window open. Close it to shut Kerf.
echo  The book lives in data\\  — copy this whole Kerf folder to keep it.
echo.
start "" http://127.0.0.1:4780
if exist "app\\server\\index.mjs" (
  "node\\node.exe" "app\\server\\index.mjs"
) else if exist "app\\index.mjs" (
  "node\\node.exe" "app\\index.mjs"
) else (
  echo Could not find the Kerf server. Run npm run build:stick again.
  pause
  exit /b 1
)
`;

const vbs = `Set sh = CreateObject("Wscript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run """" & dir & "\\Kerf.bat""", 0, False
`;

const readme = `KERF STICK
==========

This folder is the shop book. Copy the whole Kerf folder onto a USB drive
(or a folder on the shop PC). Double-click Kerf.bat.

FIRST TIME
  1. Download Node 22 Windows x64 zip from https://nodejs.org
  2. Extract node.exe into this folder as:  node\\node.exe
  3. Double-click Kerf.bat
  4. Sign up with email (this machine only — no Google needed)
  5. Sample stock is OFF. Add your own SKUs, or import a Tally XML.

KEEPING THE BOOK
  data\\pglite  is the database. It travels with the folder.
  Copy the whole Kerf folder to back up. Ledger → Export book is a JSON copy.

DO NOT
  Run two copies at once against the same data folder.
  Point Tally at this. Tally stays Tally. Kerf is the book.

CLOSE
  Close the black window (or Kerf.bat) to stop the server.
`;

async function main() {
  const sources = [join(root, ".output"), join(root, ".vercel", "output")];
  let src = null;
  for (const s of sources) {
    if (await exists(s)) {
      src = s;
      break;
    }
  }
  if (!src) {
    throw new Error("No build output. Run KERF_STICK=1 vite build first.");
  }

  await rm(out, { recursive: true, force: true });
  await mkdir(join(out, "app"), { recursive: true });
  await mkdir(join(out, "node"), { recursive: true });
  await mkdir(join(out, "data"), { recursive: true });
  await cp(src, join(out, "app"), { recursive: true });

  const entries = [];
  for (const c of findServerEntry(join(out, "app"))) {
    if (await exists(c)) entries.push(c);
  }
  console.log("[stick] packed", out);
  console.log("[stick] server entries found:", entries.length ? entries : "(none — check nitro output layout)");
  try {
    console.log("[stick] app top:", (await readdir(join(out, "app"))).join(", "));
  } catch {
    /* ignore */
  }

  await writeFile(join(out, "Kerf.bat"), bat.replaceAll("\n", "\r\n"));
  await writeFile(join(out, "Kerf-silent.vbs"), vbs.replaceAll("\n", "\r\n"));
  await writeFile(join(out, "README-STICK.txt"), readme.replaceAll("\n", "\r\n"));
  await writeFile(join(out, "node", "PUT-node.exe-HERE.txt"), "Drop portable Node 22 node.exe in this folder.\r\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
