const AUTH_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

function getOrigin(requestOrHeaders?: Request | Headers | null): string {
  if (requestOrHeaders instanceof Request) {
    return requestOrHeaders.headers.get("origin") ?? "*";
  }
  if (requestOrHeaders instanceof Headers) {
    return requestOrHeaders.get("origin") ?? "*";
  }
  return "*";
}

function appendCorsHeaders(
  headers: Headers,
  requestOrHeaders?: Request | Headers | null,
): void {
  const origin = getOrigin(requestOrHeaders);
  headers.set("Access-Control-Allow-Origin", origin);
  for (const [key, value] of Object.entries(AUTH_CORS_HEADERS)) {
    headers.set(key, value);
  }
  if (origin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  }
}

export function withCorsHeaders(
  response: Response,
  requestOrHeaders?: Request | Headers | null,
): Response {
  const headers = new Headers(response.headers);
  appendCorsHeaders(headers, requestOrHeaders);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function corsPreflightResponse(request: Request): Response {
  const headers = new Headers();
  appendCorsHeaders(headers, request);
  return new Response(null, { status: 204, headers });
}
