/**
 * Forwards the machine's fixed /iclock/... requests to the Supabase receiver.
 * The machine can't add the /functions/v1/iclock prefix Supabase needs.
 * Everything else gets a 404.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.toLowerCase().startsWith('/iclock/')) {
      return new Response('Not found', { status: 404 });
    }
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    return fetch(`${env.RECEIVER_URL}${url.pathname}${url.search}`, {
      method: request.method,
      headers: { 'Content-Type': request.headers.get('Content-Type') || 'text/plain' },
      body: request.method === 'POST' ? request.body : undefined,
    });
  },
};
