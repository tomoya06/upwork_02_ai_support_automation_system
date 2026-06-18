/**
 * Proxy-aware fetch for local development.
 *
 * Next.js dev server / server-side fetch does not respect system proxy env vars.
 * This wrapper injects an undici ProxyAgent when LOCAL_PROXY / https_proxy / http_proxy
 * is set AND the code is NOT running on Vercel.
 *
 * Vercel deployments connect directly and do not need a proxy.
 */
import { fetch as undiciFetch, ProxyAgent } from "undici";

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const proxyUrl =
  !isVercel &&
  (process.env.LOCAL_PROXY || process.env.https_proxy || process.env.http_proxy);

const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export const fetchWithProxy: typeof fetch = (input, init) => {
  if (!dispatcher) {
    return fetch(input, init);
  }
  // undici fetch signature is runtime-compatible with standard fetch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return undiciFetch(input as any, { ...init, dispatcher } as any) as unknown as Promise<Response>;
};
