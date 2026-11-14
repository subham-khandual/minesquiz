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

        // 3. Sub-route directory check (e.g. /exam/quiz-min-all-mock/index.html)
        const subIndexUrl = new URL(`${cleanPath}/index.html`, request.url);
        const subIndexRes = await env.ASSETS.fetch(new Request(subIndexUrl.toString(), request));
        if (subIndexRes.status !== 404) {
          const headers = new Headers(subIndexRes.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          return new Response(subIndexRes.body, {
            status: subIndexRes.status,
            headers,
          });
        }

        // 4. If path starts with /exam, serve /exam/index.html as dynamic exam fallback
        if (cleanPath.startsWith('/exam')) {
          const examUrl = new URL('/exam/index.html', request.url);
          const examRes = await env.ASSETS.fetch(new Request(examUrl.toString(), request));
          if (examRes.status !== 404) {
            const headers = new Headers(examRes.headers);
            headers.set('content-type', 'text/html; charset=utf-8');
            return new Response(examRes.body, { status: 200, headers });
          }
        }

        // 5. If path starts with /results, serve /results/index.html as dynamic results fallback
        if (cleanPath.startsWith('/results')) {
          const resultsUrl = new URL('/results/index.html', request.url);
          const resultsRes = await env.ASSETS.fetch(new Request(resultsUrl.toString(), request));
          if (resultsRes.status !== 404) {
            const headers = new Headers(resultsRes.headers);
            headers.set('content-type', 'text/html; charset=utf-8');
            return new Response(resultsRes.body, { status: 200, headers });
          }
        }
      }

      // 6. SPA fallback to /index.html
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
