#!/usr/bin/env node
/**
 * Same pipeline as Ctrl+S:
 * 1) Prettier --write
 * 2) ESLint --fix  (semi + no-multiple-empty-lines)
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const PRETTIER_BIN = path.join(PROJECT_ROOT, "node_modules", "prettier", "bin", "prettier.cjs");
const ESLINT_BIN = path.join(PROJECT_ROOT, "node_modules", "eslint", "bin", "eslint.js");
const PRETTIER_CONFIG = path.join(PROJECT_ROOT, ".prettierrc");
const LOG_FILE = path.join(__dirname, "hook.log");
const PENDING_FILE = path.join(__dirname, "pending-format.json");

const PRETTIER_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".html",
  ".yml",
  ".yaml",
]);

const ESLINT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

const SKIP_PATTERNS = [
  /[/\\]node_modules[/\\]/i,
  /[/\\]\.next[/\\]/i,
  /[/\\]out[/\\]/i,
  /[/\\]build[/\\]/i,
  /[/\\]references[/\\]/i,
  /[/\\]\.git[/\\]/i,
  /[/\\]\.cursor[/\\]hooks[/\\]/i,
  /package-lock\.json$/i,
  /\.min\.js$/i,
];

function log(message) {
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`, "utf8");
  } catch {
    // ignore
  }
}

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // keep the hook alive until formatting should run
  }
}

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filePath));
}

function runNode(binPath, args) {
  if (!fs.existsSync(binPath)) {
    log(`missing binary: ${binPath}`);
    return false;
  }

  const result = spawnSync(process.execPath, [binPath, ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    if (output) {
      log(`command failed (${path.basename(binPath)}): ${output}`);
    }
    return false;
  }

  return true;
}

function formatLikeSave(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    log(`skip missing: ${filePath}`);
    return false;
  }

  if (shouldSkip(filePath)) {
    log(`skip ignored: ${filePath}`);
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const before = fs.readFileSync(filePath, "utf8");

  if (PRETTIER_EXTENSIONS.has(ext)) {
    runNode(PRETTIER_BIN, ["--write", "--config", PRETTIER_CONFIG, filePath]);
  }

  if (ESLINT_EXTENSIONS.has(ext)) {
    runNode(ESLINT_BIN, ["--fix", filePath]);
  }

  const after = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : before;
  const changed = before !== after;
  log(`${changed ? "formatted" : "unchanged"}: ${filePath}`);
  return changed;
}

function readPending() {
  try {
    if (!fs.existsSync(PENDING_FILE)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(PENDING_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writePending(files) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify([...new Set(files)]), "utf8");
}

function queueFile(filePath) {
  const pending = readPending();
  pending.push(filePath);
  writePending(pending);
}

function parseToolInput(toolInput) {
  if (!toolInput) {
    return null;
  }
  if (typeof toolInput === "string") {
    try {
      return JSON.parse(toolInput);
    } catch {
      return null;
    }
  }
  return toolInput;
}

function extractFilePath(payload) {
  if (typeof payload.file_path === "string" && payload.file_path) {
    return payload.file_path;
  }

  const toolInput = parseToolInput(payload.tool_input);
  if (!toolInput) {
    return null;
  }

  return (
    toolInput.path ||
    toolInput.file_path ||
    toolInput.target_file ||
    toolInput.target_notebook ||
    null
  );
}

function resolveTargetPath(filePath) {
  if (!filePath) {
    return null;
  }

  const resolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(PROJECT_ROOT, filePath);

  const root = PROJECT_ROOT.toLowerCase();
  if (!resolved.toLowerCase().startsWith(root)) {
    return null;
  }

  return resolved;
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function formatPending(reason) {
  const pending = readPending();
  log(`${reason}: ${pending.length} pending file(s)`);

  for (const filePath of pending) {
    formatLikeSave(filePath);
  }

  writePending([]);
}

function parsePayload(raw) {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function main() {
  const input = await readStdin();
  const payload = parsePayload(input);

  if (!payload) {
    if (input.trim()) {
      log(`invalid JSON input: ${input.slice(0, 200)}`);
    }
    process.exit(0);
  }

  const eventName = payload.hook_event_name || "";

  if (eventName === "stop") {
    // Agent turn finished: format everything once, same as Ctrl+S.
    sleep(800);
    formatPending("stop");
    process.exit(0);
  }

  const resolvedPath = resolveTargetPath(extractFilePath(payload));
  if (!resolvedPath) {
    log(`no path for event=${eventName || payload.tool_name || "unknown"}`);
    process.exit(0);
  }

  queueFile(resolvedPath);
  log(`queued (${eventName || payload.tool_name || "edit"}): ${resolvedPath}`);

  // First pass soon after the edit lands on disk.
  sleep(300);
  formatLikeSave(resolvedPath);

  process.exit(0);
}

main().catch((error) => {
  log(`error: ${error.message}`);
  process.exit(0);
});
