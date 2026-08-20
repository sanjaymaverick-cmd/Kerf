#!/usr/bin/env node
/**
 * USB-stick build. Does NOT use npx (that ignores local node_modules and
 * breaks on Windows paths with spaces, e.g. D:\work Dir\Kerf).
 *
 * Requires a prior `npm install` in this folder.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const viteJs = join(root, "node_modules", "vite", "bin", "vite.js");

if (!existsSync(join(root, "node_modules")) || !existsSync(viteJs)) {
  console.error(`
Kerf stick build: dependencies are not installed.

In this folder run:

  npm install
  npm run build:stick
`);
  process.exit(1);
}

process.env.KERF_STICK = "1";

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: "inherit",
      env: process.env,
      cwd: root,
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code) reject(new Error(`${args.join(" ")} exited ${code}`));
      else resolve();
    });
  });
}

await run(process.execPath, [viteJs, "build"]);
await run(process.execPath, [join(root, "scripts", "pack-stick.mjs")]);
