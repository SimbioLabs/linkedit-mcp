import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { LinkedInTokens } from "../types.js";

const CONFIG_DIR = join(homedir(), ".linkedit-mcp");
const TOKEN_FILE = join(CONFIG_DIR, "tokens.json");

export function loadTokens(): LinkedInTokens | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    const raw = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
    if (!raw.access_token) return null;
    return raw as LinkedInTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: LinkedInTokens): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function clearTokens(): void {
  if (existsSync(TOKEN_FILE)) {
    writeFileSync(TOKEN_FILE, "{}");
  }
}

export function isTokenExpired(tokens: LinkedInTokens): boolean {
  return Date.now() >= tokens.expires_at - 60_000;
}
