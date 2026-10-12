export interface ChampionModel {
  model: string; owner: string; owner_id: string; provenance: string | null; cutoff: number
  tiers: { Medium: number; High: number }; intercept: number
  terms: { name: string; kind: 'num' | 'onehot' | 'binary'; feature: string; coef: number; mean?: number; scale?: number; category?: string; fill?: number }[]
}
export interface OrderInput {
  order_date: string; shipping_mode: string; market: string; order_region: string; customer_segment: string; payment_type: string
  n_lines: number; total_qty: number; gross_sales: number; total_discount: number; max_unit_price: number
}
export interface ChampionPrediction {
  probability: number; cutoff: number; predicted_late: boolean; tier: 'Low' | 'Medium' | 'High'; reason: string; note: string | null
}
export function engineer(order: OrderInput): Record<string, string | number>
export function score(model: ChampionModel, order: OrderInput): { probability: number; contrib: Record<string, number>; features: Record<string, string | number> }
export function reason(contrib: Record<string, number>, f: Record<string, string | number>, reference: unknown): string
export function predict(model: ChampionModel, reference: unknown, order: OrderInput): ChampionPrediction
