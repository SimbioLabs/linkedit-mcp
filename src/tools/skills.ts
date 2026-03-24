import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLinkedInClient } from "../api/client.js";

export function registerSkillsTools(server: McpServer): void {
  server.tool(
    "get_skills",
    "Retrieve all skills listed on the authenticated user's LinkedIn profile.",
    {},
    async () => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/me?projection=(id)");
      const userId: string = meRes.data.id;

      const res = await client.get("/v2/skills", {
        params: {
          q: "members",
          members: `List(urn:li:member:${userId})`,
          projection: "(elements*(id,name))",
        },
      });

      return {
        content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
      };
    }
  );

  server.tool(
    "add_skill",
    "Add a skill to the authenticated user's LinkedIn profile.",
    {
      skill_name: z
        .string()
        .describe(
          "The skill to add (e.g. 'TypeScript', 'Product Management', 'Machine Learning')"
        ),
    },
    async ({ skill_name }) => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/me?projection=(id)");
      const userId: string = meRes.data.id;

      await client.post("/v2/skills", {
        member: `urn:li:member:${userId}`,
        name: skill_name,
      });

      return {
        content: [{ type: "text", text: `Skill "${skill_name}" added.` }],
      };
    }
  );

  server.tool(
    "remove_skill",
    "Remove a skill from the authenticated user's LinkedIn profile.",
    {
      skill_id: z
        .string()
        .describe("The skill ID to remove (get it from get_skills)"),
    },
    async ({ skill_id }) => {
      const client = createLinkedInClient();
      await client.delete(`/v2/skills/${skill_id}`);

      return {
        content: [{ type: "text", text: `Skill ${skill_id} removed.` }],
      };
    }
  );
}
