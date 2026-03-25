import { createServer } from "http";
import { URL } from "url";
import axios from "axios";
import open from "open";
import { saveTokens } from "./token-store.js";
import type { LinkedInTokens } from "../types.js";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
];

export async function startOAuthFlow(
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<LinkedInTokens> {
  const callbackUrl = new URL(redirectUri);
  const port = parseInt(callbackUrl.port || "3000");
  const state = Math.random().toString(36).substring(2);

  const authUrl = new URL(LINKEDIN_AUTH_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", SCOPES.join(" "));

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      if (!req.url?.startsWith(callbackUrl.pathname)) return;

      const url = new URL(req.url, `http://localhost:${port}`);
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      const closeWith = (status: number, html: string) => {
        res.writeHead(status, { "Content-Type": "text/html" });
        res.end(html);
        server.close();
      };

      if (error) {
        closeWith(400, `<h2>Authorization failed: ${error}</h2><p>You can close this tab.</p>`);
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code || returnedState !== state) {
        closeWith(400, "<h2>Invalid request.</h2><p>You can close this tab.</p>");
        reject(new Error("Invalid state parameter"));
        return;
      }

      try {
        const response = await axios.post(
          LINKEDIN_TOKEN_URL,
          new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const tokens: LinkedInTokens = {
          access_token: response.data.access_token,
          expires_at: Date.now() + response.data.expires_in * 1000,
          ...(response.data.refresh_token && {
            refresh_token: response.data.refresh_token,
            refresh_token_expires_at:
              Date.now() + response.data.refresh_token_expires_in * 1000,
          }),
        };

        saveTokens(tokens);
        closeWith(
          200,
          "<h2>Authentication successful!</h2><p>You can close this tab and return to your AI assistant.</p>"
        );
        resolve(tokens);
      } catch (err) {
        closeWith(500, "<h2>Token exchange failed.</h2><p>You can close this tab.</p>");
        reject(err);
      }
    });

    server.listen(port, () => {
      console.error(`\nOpening LinkedIn authorization in your browser...`);
      console.error(`If it does not open automatically, visit:\n${authUrl.toString()}\n`);
      open(authUrl.toString());
    });

    server.on("error", reject);
  });
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<LinkedInTokens> {
  const response = await axios.post(
    LINKEDIN_TOKEN_URL,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const tokens: LinkedInTokens = {
    access_token: response.data.access_token,
    expires_at: Date.now() + response.data.expires_in * 1000,
    refresh_token: response.data.refresh_token ?? refreshToken,
    ...(response.data.refresh_token_expires_in && {
      refresh_token_expires_at:
        Date.now() + response.data.refresh_token_expires_in * 1000,
    }),
  };

  saveTokens(tokens);
  return tokens;
}
