import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestText = fs.readFileSync(path.join(root, "games_manifest.js"), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(manifestText, context);

const output = {};
for (const game of context.window.STEP1_GAMES) {
  const html = fs.readFileSync(path.join(root, game.file), "utf8");
  const match = html.match(/const QBANK\s*=\s*(\[[\s\S]*?\]);\s*(?:\/\*[\s\S]*?\*\/\s*)?const VAULT/);
  if (!match) throw new Error(`Could not find QBANK in ${game.file}`);
  output[game.saveKey] = {
    title: game.title,
    file: game.file,
    deck: game.deck,
    questions: vm.runInNewContext(`(${match[1]})`)
  };
}

process.stdout.write(JSON.stringify(output, null, 2));
