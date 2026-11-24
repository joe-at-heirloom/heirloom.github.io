// heirloomapp.io: every request is a static file (wrangler.jsonc "assets"),
// except www.heirloomapp.io, which redirects to the bare domain as GitHub
// Pages did.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.heirloomapp.io') {
      url.hostname = 'heirloomapp.io';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
