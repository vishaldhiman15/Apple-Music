import { handleApi } from "./api.js";
import demo from "../src/data/catalog.json";
const assets = __STATIC_ASSETS__;
const media = __CLOUD_MEDIA__;
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/"))
      return handleApi(request, env, { demo });
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });
    if (media[url.pathname])
      return Response.redirect(media[url.pathname].url, 302);
    const asset =
      assets[url.pathname] ||
      (!url.pathname.split("/").at(-1).includes(".")
        ? assets["/index.html"]
        : null);
    if (!asset) return new Response("Not found", { status: 404 });
    const headers = {
      "Content-Type": asset.type,
      "Cache-Control": url.pathname.startsWith("/assets/")
        ? "public,max-age=31536000,immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self';",
    };
    return new Response(request.method === "HEAD" ? null : asset.body, {
      headers,
    });
  },
};
