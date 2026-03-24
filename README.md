# linkedit-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants read and edit your LinkedIn profile — headline, about section, work experience, education, and skills.

Built by [SimbioLabs](https://github.com/SimbioLabs).

---

## Tools

| Tool | Description |
|---|---|
| `authenticate` | Start OAuth 2.0 flow — opens LinkedIn in your browser |
| `logout` | Clear stored session tokens |
| `get_profile` | Read name, headline, about, email, and vanity URL |
| `update_headline` | Update your LinkedIn headline (max 220 chars) |
| `update_about` | Update your About / summary section (max 2600 chars) |
| `get_experience` | List all work experience entries |
| `add_experience` | Add a new position |
| `update_experience` | Edit an existing position |
| `delete_experience` | Remove a position |
| `get_education` | List all education entries |
| `add_education` | Add a new education entry |
| `update_education` | Edit an existing education entry |
| `delete_education` | Remove an education entry |
| `get_skills` | List all skills |
| `add_skill` | Add a skill |
| `remove_skill` | Remove a skill |

---

## Setup

### 1. Create a LinkedIn Developer App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) and create a new app.
2. Under **Auth**, add `http://localhost:3000/callback` as an OAuth 2.0 redirect URL.
3. Under **Products**, request access to **Sign In with LinkedIn using OpenID Connect** (provides `r_liteprofile`, `r_emailaddress`).
4. Copy your **Client ID** and **Client Secret**.

> **Note on profile write access:** The `update_headline`, `update_about`, `add_experience`, `add_education`, and skill tools use LinkedIn's profile write API, which requires your app to have the **LinkedIn Partner Program** permissions (`w_member_social` is open, but full profile write requires partner approval). Check [LinkedIn API access levels](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) for details.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/callback
```

### 3. Install and build

```bash
npm install
npm run build
```

### 4. Add to Cursor / Claude Desktop

In your MCP config (e.g. `~/.cursor/mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "linkedit": {
      "command": "node",
      "args": ["/absolute/path/to/linkedit-mcp/dist/index.js"],
      "env": {
        "LINKEDIN_CLIENT_ID": "your_client_id",
        "LINKEDIN_CLIENT_SECRET": "your_client_secret",
        "LINKEDIN_REDIRECT_URI": "http://localhost:3000/callback"
      }
    }
  }
}
```

### 5. Authenticate

In your AI assistant, run:

```
authenticate
```

A browser window will open. Approve the LinkedIn permissions, then return to your assistant — you're ready.

---

## Example usage

```
Update my LinkedIn headline to "Founder @ SimbioLabs | Building AI-native products"
```

```
Add a new job: Software Engineer at Acme Corp, Jan 2022 to Mar 2024, describe it as leading backend infrastructure for a B2B SaaS platform
```

```
Add my MBA from Stanford Graduate School of Business, 2019–2021
```

---

## Token storage

Tokens are stored locally at `~/.linkedit-mcp/tokens.json`. They are never sent anywhere other than LinkedIn's OAuth endpoints. Use `logout` to clear them at any time.

---

## Development

```bash
npm run dev   # watch mode
npm start     # run compiled server
```

---

## License

MIT — [SimbioLabs](https://github.com/SimbioLabs)
