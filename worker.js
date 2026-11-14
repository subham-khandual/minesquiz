export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      if (!env.ASSETS) {
        return new Response("Service temporarily initializing. Please refresh.", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      // 1. Direct asset request (exact file matches e.g. /_next/static/..., /images/..., robots.txt)
      let response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }

      // 2. Clean URL mapping for HTML pages (e.g. /admin -> /admin.html, / -> /index.html)
      if (!pathname.includes('.')) {
        const cleanPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        const htmlTarget = cleanPath === '' ? '/index.html' : `${cleanPath}.html`;
        const htmlUrl = new URL(htmlTarget, request.url);
        response = await env.ASSETS.fetch(new Request(htmlUrl.toString(), request));

        if (response.status !== 404) {
          const headers = new Headers(response.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      }

      // 3. Fallback to index.html for client-side dynamic routes
      const fallbackUrl = new URL('/index.html', request.url);
      const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
      if (fallbackResponse.status !== 404) {
        const headers = new Headers(fallbackResponse.headers);
        headers.set('content-type', 'text/html; charset=utf-8');
        return new Response(fallbackResponse.body, {
          status: 200,
          headers,
        });
      }

      return new Response("Page not found", { status: 404 });
    } catch (err) {
      return new Response(`Worker Error: ${err.message}`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  },
};
