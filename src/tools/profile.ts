import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLinkedInClient } from "../api/client.js";

export function registerProfileTools(server: McpServer): void {
  server.tool(
    "get_profile",
    "Retrieve the authenticated user's LinkedIn profile: name, headline, about/summary, vanity URL, and email.",
    {},
    async () => {
      const client = createLinkedInClient();

      const res = await client.get("/v2/userinfo");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(res.data, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "update_headline",
    "Update the authenticated user's LinkedIn headline (max 220 characters).",
    {
      headline: z
        .string()
        .max(220)
        .describe("The new headline text (max 220 characters)"),
    },
    async ({ headline }) => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/userinfo");
      const userId: string = meRes.data.sub;
      const locale = (meRes.data.locale as { language: string; country: string }) ?? {
        language: "en",
        country: "US",
      };
      const localeKey = `${locale.language}_${locale.country}`;

      await client.patch(`/v2/people/(id:${userId})`, {
        patch: {
          $set: {
            headline: {
              localized: { [localeKey]: headline },
              preferredLocale: locale,
            },
          },
        },
      });

      return {
        content: [
          { type: "text", text: `Headline updated to: "${headline}"` },
        ],
      };
    }
  );

  server.tool(
    "update_about",
    "Update the authenticated user's LinkedIn About / summary section (max 2600 characters).",
    {
      about: z
        .string()
        .max(2600)
        .describe("The new About/summary text (max 2600 characters)"),
    },
    async ({ about }) => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/userinfo");
      const userId: string = meRes.data.sub;

      await client.patch(`/v2/people/(id:${userId})`, {
        patch: { $set: { summary: about } },
      });

      return {
        content: [{ type: "text", text: "About section updated." }],
      };
    }
  );
}
