/** Teksten uit Node/undici bij tijdelijke netwerkproblemen (DNS, TCP-reset, TLS handshake). */
function transientFetchSignals(lower: string): boolean {
  return (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower.includes("econnrefused") ||
    lower.includes("econnreset") ||
    lower.includes("enetunreach") ||
    lower.includes("ehostunreach") ||
    lower.includes("etimedout") ||
    lower.includes("epipe") ||
    lower.includes("socket hang up") ||
    lower.includes("enotfound") ||
    lower.includes("getaddrinfo") ||
    lower.includes("certificate") ||
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("other side closed") ||
    lower.includes("premature close")
  );
}

function collectErrorText(err: unknown): string {
  const chunks: string[] = [];
  let current: unknown = err;
  for (let depth = 0; depth < 6 && current; depth++) {
    if (current instanceof Error) {
      chunks.push(current.message);
      current = current.cause;
    } else if (typeof current === "string") {
      chunks.push(current);
      break;
    } else if (current && typeof current === "object" && "message" in current) {
      chunks.push(String((current as { message: unknown }).message));
      break;
    } else {
      chunks.push(String(current));
      break;
    }
  }
  return chunks.join(" ").toLowerCase();
}

function isTransientNetworkError(err: unknown): boolean {
  return transientFetchSignals(collectErrorText(err));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const RETRIES = 3;
const BASE_DELAY_MS = 75;

/**
 * `fetch` met een paar korte retries bij tijdelijke fouten (o.a. `TypeError: fetch failed` in Node onder Windows/Turbopack).
 * Edge-compatibel (geen Node-only APIs).
 */
export async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(input, init);
      return response;
    } catch (err) {
      lastError = err;
      const transient = isTransientNetworkError(err);
      if (!transient || attempt === RETRIES) {
        throw err;
      }
      await sleep(BASE_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
}
