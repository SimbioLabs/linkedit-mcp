import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLinkedInClient } from "../api/client.js";

export function registerExperienceTools(server: McpServer): void {
  server.tool(
    "get_experience",
    "Retrieve all work experience entries from the authenticated user's LinkedIn profile.",
    {},
    async () => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/userinfo");
      const userId: string = meRes.data.sub;

      const res = await client.get("/v2/positions", {
        params: {
          q: "members",
          members: `List(urn:li:member:${userId})`,
          projection: "(elements*(id,title,companyName,description,startMonthYear,endMonthYear,isCurrent,location))",
        },
      });

      return {
        content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
      };
    }
  );

  server.tool(
    "add_experience",
    "Add a new work experience entry to the authenticated user's LinkedIn profile.",
    {
      title: z.string().describe("Job title"),
      company_name: z.string().describe("Company name"),
      description: z.string().optional().describe("Role description"),
      start_month: z.number().min(1).max(12).describe("Start month (1–12)"),
      start_year: z.number().min(1900).describe("Start year"),
      end_month: z
        .number()
        .min(1)
        .max(12)
        .optional()
        .describe("End month (omit if this is your current role)"),
      end_year: z
        .number()
        .optional()
        .describe("End year (omit if this is your current role)"),
      is_current: z
        .boolean()
        .default(false)
        .describe("Set to true if this is your current role"),
      location: z.string().optional().describe("Work location"),
    },
    async ({
      title,
      company_name,
      description,
      start_month,
      start_year,
      end_month,
      end_year,
      is_current,
      location,
    }) => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/userinfo");
      const userId: string = meRes.data.sub;

      const position: Record<string, unknown> = {
        title,
        companyName: company_name,
        member: `urn:li:member:${userId}`,
        startMonthYear: { month: start_month, year: start_year },
        isCurrent: is_current,
      };

      if (description) position.description = description;
      if (location) position.location = location;
      if (!is_current && end_month && end_year) {
        position.endMonthYear = { month: end_month, year: end_year };
      }

      await client.post("/v2/positions", position);

      return {
        content: [
          {
            type: "text",
            text: `Experience "${title}" at ${company_name} added.`,
          },
        ],
      };
    }
  );

  server.tool(
    "update_experience",
    "Update an existing work experience entry on the authenticated user's LinkedIn profile.",
    {
      position_id: z
        .string()
        .describe("The position ID to update (get it from get_experience)"),
      title: z.string().optional().describe("New job title"),
      company_name: z.string().optional().describe("New company name"),
      description: z.string().optional().describe("New role description"),
      start_month: z.number().min(1).max(12).optional().describe("New start month"),
      start_year: z.number().min(1900).optional().describe("New start year"),
      end_month: z.number().min(1).max(12).optional().describe("New end month"),
      end_year: z.number().optional().describe("New end year"),
      is_current: z.boolean().optional().describe("Is this your current role?"),
      location: z.string().optional().describe("New work location"),
    },
    async ({
      position_id,
      title,
      company_name,
      description,
      start_month,
      start_year,
      end_month,
      end_year,
      is_current,
      location,
    }) => {
      const client = createLinkedInClient();

      const updates: Record<string, unknown> = {};
      if (title) updates.title = title;
      if (company_name) updates.companyName = company_name;
      if (description) updates.description = description;
      if (location) updates.location = location;
      if (is_current !== undefined) updates.isCurrent = is_current;
      if (start_month && start_year) {
        updates.startMonthYear = { month: start_month, year: start_year };
      }
      if (end_month && end_year) {
        updates.endMonthYear = { month: end_month, year: end_year };
      }

      await client.patch(`/v2/positions/${position_id}`, {
        patch: { $set: updates },
      });

      return {
        content: [
          { type: "text", text: `Experience ${position_id} updated.` },
        ],
      };
    }
  );

  server.tool(
    "delete_experience",
    "Delete a work experience entry from the authenticated user's LinkedIn profile.",
    {
      position_id: z
        .string()
        .describe("The position ID to delete (get it from get_experience)"),
    },
    async ({ position_id }) => {
      const client = createLinkedInClient();
      await client.delete(`/v2/positions/${position_id}`);

      return {
        content: [
          { type: "text", text: `Experience ${position_id} deleted.` },
        ],
      };
    }
  );
}
