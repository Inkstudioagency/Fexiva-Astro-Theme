# Fexiva — Strapi CMS

Strapi 5 backend for the Fexiva Astro theme. It defines three collection types and enables the Strapi MCP server.

| Content type    | API endpoint        | Notes                                              |
| :-------------- | :------------------ | :------------------------------------------------- |
| **Blog Post**   | `/api/blog-posts`   | Draft & Publish, relation to Author, Blocks bodies |
| **Author**      | `/api/authors`      | Name, photo, role, bio                             |
| **Integration** | `/api/integrations` | Draft & Publish, SVG logo, Blocks bodies           |

## Setup

```sh
cp .env.example .env   # replace every "tobemodified" value with a random secret
npm install
npm run develop        # admin panel at http://localhost:1337/admin
```

## Demo content

`data/seed.json` and `data/media/` contain the demo posts, authors and integrations. With Strapi running:

1. Create an **Admin token** (Settings → Admin Tokens) with Content Manager create, read, update and publish on Author, Blog Post and Integration, and Media Library read and update.
2. Fill `STRAPI_ADMIN_EMAIL`, `STRAPI_ADMIN_PASSWORD` and `STRAPI_MCP_TOKEN` in `.env`.
3. Run `npm run seed`.

The script uploads the media through the Upload API, since the MCP server cannot upload files. It then sets alt texts and creates and publishes every entry through the MCP server's tools (`create_*`, `publish_*`, `media_update_asset`). It is safe to run more than once.

## MCP server

Enabled in `config/server.ts` (`mcp.enabled`, or `MCP_ENABLED=false` to turn it off). The endpoint is `POST /mcp`, authenticated with an Admin token. See the [Strapi MCP server docs](https://docs.strapi.io/cms/features/strapi-mcp-server).

## Connecting the theme

Create a read-only **API token** (Settings → API Tokens) and set `STRAPI_URL` and `STRAPI_API_TOKEN` in the theme's `.env`.
