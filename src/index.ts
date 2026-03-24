#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config";

import { startOAuthFlow } from "./auth/oauth.js";
import { loadTokens, clearTokens, isTokenExpired } from "./auth/token-store.js";
import { registerProfileTools } from "./tools/profile.js";
import { registerExperienceTools } from "./tools/experience.js";
import { registerEducationTools } from "./tools/education.js";
import { registerSkillsTools } from "./tools/skills.js";

const server = new McpServer({
  name: "linkedit-mcp",
  version: "0.1.0",
});

server.tool(
  "authenticate",
  "Authenticate with LinkedIn via OAuth 2.0. Opens a browser window for authorization. Must be called before using any other tool.",
  {},
  async () => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ?? "http://localhost:3000/callback";

    if (!clientId || !clientSecret) {
      return {
        content: [
          {
            type: "text",
            text: "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET. Copy .env.example to .env and fill in your credentials from https://www.linkedin.com/developers/apps",
          },
        ],
      };
    }

    const existing = loadTokens();
    if (existing?.access_token && !isTokenExpired(existing)) {
      return {
        content: [
          {
            type: "text",
            text: "Already authenticated. Your LinkedIn session is active.",
          },
        ],
      };
    }

    await startOAuthFlow(clientId, clientSecret, redirectUri);

    return {
      content: [
        {
          type: "text",
          text: "Authentication successful. You can now use all profile tools.",
        },
      ],
    };
  }
);

server.tool(
  "logout",
  "Clear the stored LinkedIn session tokens.",
  {},
  async () => {
    clearTokens();
    return {
      content: [{ type: "text", text: "Logged out. Tokens cleared." }],
    };
  }
);

registerProfileTools(server);
registerExperienceTools(server);
registerEducationTools(server);
registerSkillsTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("linkedit-mcp running");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
