/**
 * Core Ticketmaster HTTP Client Configuration and Handlers
 */

export const TM_BASE_URL =
  process.env.NEXT_PUBLIC_TICKETMASTER_BASE_URL ||
  'https://app.ticketmaster.com/discovery/v2';

export const TM_API_KEY =
  process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY ||
  'aida6OnYLISdlPlYPKABTjLpgMoP4qec';

export const TM_PARTNER_BASE_URL =
  process.env.NEXT_PUBLIC_TICKETMASTER_PARTNER_BASE_URL ||
  'https://app.ticketmaster.com/partners/v1';

export const TM_PARTNER_API_KEY =
  process.env.NEXT_PUBLIC_TICKETMASTER_PARTNER_API_KEY ||
  TM_API_KEY;

/**
 * Standard Discovery API HTTP request handler
 */
export async function tmRequest<T>(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<T> {
  const url = new URL(`${TM_BASE_URL}${endpoint}`);
  url.searchParams.set('apikey', TM_API_KEY);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.set(key, String(val));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    next: { revalidate: 300 }, // 5 min Next.js cache
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Resource not found at ${endpoint}`);
    }
    let errDetail = `${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.fault?.faultstring) {
        errDetail = errJson.fault.faultstring;
      } else if (errJson.message) {
        errDetail = errJson.message;
      }
    } catch { }
    throw new Error(`Ticketmaster API error: ${errDetail}`);
  }

  return response.json();
}

/**
 * Ticketmaster Partner Commerce API HTTP request handler
 */
export async function partnerRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    params?: Record<string, any>;
  } = {},
): Promise<{ ok: boolean; status: number; data?: T; pollingUrl?: string; error?: string }> {
  try {
    const url = new URL(`${TM_PARTNER_BASE_URL}${endpoint}`);
    url.searchParams.set('apikey', TM_PARTNER_API_KEY);

    if (options.params) {
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.set(key, String(val));
        }
      });
    }

    const res = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Handle HTTP 202 Accepted (asynchronous reservation / polling queue)
    if (res.status === 202) {
      const json = await res.json().catch(() => ({}));
      const pollingUrl = json.polling_url || res.headers.get('Location') || undefined;
      return { ok: true, status: 202, pollingUrl, data: json };
    }

    if (!res.ok) {
      let errDetail = `${res.status} ${res.statusText}`;
      try {
        const errJson = await res.json();
        errDetail =
          errJson.fault?.faultstring ||
          errJson.message ||
          errJson.error ||
          errJson.description ||
          errDetail;
      } catch { }
      return { ok: false, status: res.status, error: errDetail };
    }

    const data = await res.json().catch(() => ({}));
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message || 'Network request failed' };
  }
}
