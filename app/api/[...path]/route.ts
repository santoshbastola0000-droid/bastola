import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_ORIGIN =
  process.env.BACKEND_PROXY_URL || "https://api.roomkhoj.com";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(
  request: NextRequest,
  { params }: RouteContext,
) {
  const { path } = await params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `/${path.map(encodeURIComponent).join("/")}`,
    BACKEND_ORIGIN,
  );
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers();

  for (const name of [
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-requested-with",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
