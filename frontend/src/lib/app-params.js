// The original app-params.js parsed Base44 platform bootstrap params (app_id,
// access_token, etc.) from the URL/localStorage. Auth in this project now runs
// through Supabase (see src/api/base44Client.js / src/api/supabaseClient.js),
// so nothing else needs this file — except src/pages/OAuthConsent.jsx, which
// is Base44's platform-hosted MCP ("let an AI client use this app") consent
// screen. That flow calls Base44-hosted endpoints (/api/apps/:id/mcp/...)
// that don't exist outside Base44 hosting, so this stub just keeps the page
// from crashing on import; the page itself won't have a working backend
// until you either drop it or build an equivalent MCP server. See README.md.
export const appParams = {
  appId: undefined,
  token: null,
};
