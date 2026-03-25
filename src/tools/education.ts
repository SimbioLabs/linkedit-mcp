import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLinkedInClient } from "../api/client.js";

export function registerEducationTools(server: McpServer): void {
  server.tool(
    "get_education",
    "Retrieve all education entries from the authenticated user's LinkedIn profile.",
    {},
    async () => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/userinfo");
      const userId: string = meRes.data.sub;

      const res = await client.get("/v2/educations", {
        params: {
          q: "members",
          members: `List(urn:li:member:${userId})`,
          projection:
            "(elements*(id,schoolName,degreeName,fieldOfStudy,startMonthYear,endMonthYear,description,activities))",
        },
      });

      return {
        content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
      };
    }
  );

  server.tool(
    "add_education",
    "Add a new education entry to the authenticated user's LinkedIn profile.",
    {
      school_name: z.string().describe("Name of the school or university"),
      degree: z
        .string()
        .optional()
        .describe("Degree type (e.g. Bachelor of Science, MBA)"),
      field_of_study: z
        .string()
        .optional()
        .describe("Field of study or major (e.g. Computer Science)"),
      start_year: z.number().optional().describe("Start year"),
      end_year: z
        .number()
        .optional()
        .describe("End year or expected graduation year"),
      description: z.string().optional().describe("Additional notes or description"),
      activities: z.string().optional().describe("Activities and societies"),
    },
    async ({
      school_name,
      degree,
      field_of_study,
      start_year,
      end_year,
      description,
      activities,
    }) => {
      const client = createLinkedInClient();

      const meRes = await client.get("/v2/userinfo");
      const userId: string = meRes.data.sub;

      const education: Record<string, unknown> = {
        schoolName: school_name,
        member: `urn:li:member:${userId}`,
      };

      if (degree) education.degreeName = degree;
      if (field_of_study) education.fieldOfStudy = field_of_study;
      if (start_year) education.startMonthYear = { year: start_year };
      if (end_year) education.endMonthYear = { year: end_year };
      if (description) education.description = description;
      if (activities) education.activities = activities;

      await client.post("/v2/educations", education);

      return {
        content: [
          {
            type: "text",
            text: `Education "${school_name}"${degree ? ` — ${degree}` : ""} added.`,
          },
        ],
      };
    }
  );

  server.tool(
    "update_education",
    "Update an existing education entry on the authenticated user's LinkedIn profile.",
    {
      education_id: z
        .string()
        .describe("The education ID to update (get it from get_education)"),
      school_name: z.string().optional().describe("New school name"),
      degree: z.string().optional().describe("New degree type"),
      field_of_study: z.string().optional().describe("New field of study"),
      start_year: z.number().optional().describe("New start year"),
      end_year: z.number().optional().describe("New end year"),
      description: z.string().optional().describe("New description"),
      activities: z.string().optional().describe("New activities and societies"),
    },
    async ({
      education_id,
      school_name,
      degree,
      field_of_study,
      start_year,
      end_year,
      description,
      activities,
    }) => {
      const client = createLinkedInClient();

      const updates: Record<string, unknown> = {};
      if (school_name) updates.schoolName = school_name;
      if (degree) updates.degreeName = degree;
      if (field_of_study) updates.fieldOfStudy = field_of_study;
      if (start_year) updates.startMonthYear = { year: start_year };
      if (end_year) updates.endMonthYear = { year: end_year };
      if (description) updates.description = description;
      if (activities) updates.activities = activities;

      await client.patch(`/v2/educations/${education_id}`, {
        patch: { $set: updates },
      });

      return {
        content: [
          { type: "text", text: `Education ${education_id} updated.` },
        ],
      };
    }
  );

  server.tool(
    "delete_education",
    "Delete an education entry from the authenticated user's LinkedIn profile.",
    {
      education_id: z
        .string()
        .describe("The education ID to delete (get it from get_education)"),
    },
    async ({ education_id }) => {
      const client = createLinkedInClient();
      await client.delete(`/v2/educations/${education_id}`);

      return {
        content: [
          { type: "text", text: `Education ${education_id} deleted.` },
        ],
      };
    }
  );
}
