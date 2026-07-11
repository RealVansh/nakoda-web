// @ts-nocheck
/**
 * Nakoda D1 Proxy Worker
 * 
 * This Cloudflare Worker acts as an API gateway between the Next.js app (on Vercel)
 * and the D1 SQLite database. All requests are authenticated via a shared secret.
 * 
 * Endpoints:
 *   POST /query   — Execute a single SQL query (SELECT, INSERT, UPDATE, DELETE)
 *   POST /batch   — Execute multiple SQL queries in a transaction
 */

interface Env {
  DB: D1Database
  API_SECRET: string
}

interface QueryRequest {
  sql: string
  params?: unknown[]
}

interface BatchRequest {
  queries: QueryRequest[]
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405)
    }

    // Authenticate via shared secret
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
      return errorResponse('Unauthorized', 401)
    }

    const url = new URL(request.url)

    try {
      // ── Single Query ──
      if (url.pathname === '/query') {
        const body = (await request.json()) as QueryRequest

        if (!body.sql || typeof body.sql !== 'string') {
          return errorResponse('Missing or invalid "sql" field')
        }

        const stmt = env.DB.prepare(body.sql)
        const bound = body.params?.length ? stmt.bind(...body.params) : stmt

        // Determine if it's a read or write query
        const trimmed = body.sql.trim().toUpperCase()
        const isRead = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')

        if (isRead) {
          const result = await bound.all()
          return jsonResponse({
            results: result.results,
            meta: result.meta,
          })
        } else {
          const result = await bound.run()
          return jsonResponse({
            success: result.success,
            meta: result.meta,
          })
        }
      }

      // ── Batch (Transaction) ──
      if (url.pathname === '/batch') {
        const body = (await request.json()) as BatchRequest

        if (!body.queries || !Array.isArray(body.queries)) {
          return errorResponse('Missing or invalid "queries" array')
        }

        const stmts = body.queries.map((q) => {
          const stmt = env.DB.prepare(q.sql)
          return q.params?.length ? stmt.bind(...q.params) : stmt
        })

        const results = await env.DB.batch(stmts)
        return jsonResponse({
          results: results.map((r) => ({
            results: r.results,
            meta: r.meta,
          })),
        })
      }

      return errorResponse('Not found', 404)
    } catch (err) {
      console.error('D1 Proxy Error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      return errorResponse(message, 500)
    }
  },
}
