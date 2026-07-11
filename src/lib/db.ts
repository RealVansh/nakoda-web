const D1_API_URL = () => process.env.D1_API_URL!;
const D1_API_SECRET = () => process.env.D1_API_SECRET!;

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${D1_API_SECRET()}`,
  };
}

/**
 * Execute a SELECT query and return all matching rows.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await fetch(`${D1_API_URL()}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ sql, params: params ?? [] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 query failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data.results ?? []) as T[];
}

/**
 * Execute a SELECT query and return the first row, or null if none found.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a write statement (INSERT, UPDATE, DELETE) and return success status.
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<{ success: boolean; meta?: unknown }> {
  const res = await fetch(`${D1_API_URL()}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ sql, params: params ?? [] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 execute failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { success: data.success ?? true, meta: data.meta };
}

/**
 * Execute multiple queries in a single batch request.
 */
export async function batch(
  queries: { sql: string; params?: unknown[] }[]
): Promise<unknown[]> {
  const res = await fetch(`${D1_API_URL()}/batch`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      queries: queries.map((q) => ({ sql: q.sql, params: q.params ?? [] })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 batch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.results ?? [];
}
