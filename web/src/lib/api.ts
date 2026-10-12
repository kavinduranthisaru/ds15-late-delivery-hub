/** Small fetch wrapper for the FastAPI back end (proxied at /api by Vite). */
export class ApiError extends Error {
  constructor(message: string, public status: number, public detail?: unknown) { super(message) }
}

export async function api<T>(path: string, init?: RequestInit, timeoutMs = 10000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`/api${path}`, { ...init, signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      const detail = body?.detail
      const msg = typeof detail === 'string' ? detail : res.status === 422 ? 'Some fields need fixing.' : `Request failed (${res.status}).`
      throw new ApiError(msg, res.status, detail)
    }
    return body as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError('The prediction service is not reachable. Start the API (see README) and try again.', 0)
  } finally {
    clearTimeout(timer)
  }
}

export interface Order {
  order_date: string; shipping_mode: string; market: string; order_region: string; customer_segment: string
  payment_type: string; n_lines: number; total_qty: number; gross_sales: number; total_discount: number; max_unit_price: number
}
export interface Prediction {
  model: string; label: string; owner_name: string; owner_id: string; available: boolean
  probability: number | null; cutoff: number | null; cutoff_source: string | null; predicted_late: boolean | null
  tier: 'Low' | 'Medium' | 'High' | null; reason: string | null; provenance: string | null; note: string | null
}
export interface Reference {
  categories: Record<'shipping_mode' | 'market' | 'order_region' | 'customer_segment' | 'payment_type', string[]>
  market_regions: Record<string, string[]>
  numeric: Record<string, { min: number; median: number; max: number }>
}
export interface Example { key: 'low' | 'mixed' | 'high'; title: string; why: string; order_id: number; actual_late: number; champion_probability: number; order: Order }
