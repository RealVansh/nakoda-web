const D1_API_URL = () => process.env.D1_API_URL!;
const D1_API_SECRET = () => process.env.D1_API_SECRET!;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${D1_API_SECRET()}`,
  };
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(id);

    // Retry on 5xx server errors
    if (!res.ok && res.status >= 500 && retries > 0) {
      console.warn(`[DB API] ${res.status} on ${url}, retrying...`);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return res;
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'AbortError') {
      throw new Error(`[DB API] Request to ${url} timed out after ${DEFAULT_TIMEOUT}ms`);
    }
    if (retries > 0) {
      console.warn(`[DB API] Fetch error on ${url}, retrying...`, err);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = 'API request failed';
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // Ignored
    }
    // Prevent leaking raw server internals, just throw a generic error if it's a 500
    if (res.status >= 500) {
      throw new Error('Database service unavailable');
    }
    throw new Error(`API Error (${res.status}): ${message}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${D1_API_URL()}${path}`;
  const res = await fetchWithRetry(url, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${D1_API_URL()}${path}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const url = `${D1_API_URL()}${path}`;
  const res = await fetchWithRetry(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const url = `${D1_API_URL()}${path}`;
  const res = await fetchWithRetry(url, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<T>(res);
}
