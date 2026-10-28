import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // Strapi MCP server (https://docs.strapi.io/cms/features/strapi-mcp-server).
  // Exposes POST /mcp for AI clients authenticated with an Admin token.
  mcp: {
    enabled: env.bool('MCP_ENABLED', true),
  },
});

export default config;
