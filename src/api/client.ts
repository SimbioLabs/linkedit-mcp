import axios, { type AxiosInstance } from "axios";
import { loadTokens, isTokenExpired } from "../auth/token-store.js";
import { refreshAccessToken } from "../auth/oauth.js";

const BASE_URL = "https://api.linkedin.com";
const LINKEDIN_VERSION = "202502";

export function createLinkedInClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": LINKEDIN_VERSION,
    },
  });

  client.interceptors.request.use(async (config) => {
    let tokens = loadTokens();

    if (!tokens?.access_token) {
      throw new Error(
        "Not authenticated. Use the `authenticate` tool first."
      );
    }

    if (isTokenExpired(tokens)) {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error("Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in environment.");
      }

      if (tokens.refresh_token) {
        tokens = await refreshAccessToken(clientId, clientSecret, tokens.refresh_token);
      } else {
        throw new Error(
          "Session expired. Use the `authenticate` tool to log in again."
        );
      }
    }

    config.headers.Authorization = `Bearer ${tokens.access_token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const message =
        err.response?.data?.message ?? err.response?.data ?? err.message;
      throw new Error(`LinkedIn API error: ${JSON.stringify(message)}`);
    }
  );

  return client;
}
