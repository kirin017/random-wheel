import { type Order, summarizeOrderItems } from './shopCatalog'

export interface SheetLeadPayload {
  type: 'lead'
  name: string
  phone: string
  prize: string
  consent: boolean
  timestamp: number
}

export interface SheetOrderPayload {
  type: 'order'
  customerName: string
  phone: string
  address: string
  preferredTime: string
  note: string
  itemSummary: string
  subtotal: number
  status: string
  timestamp: number
}

export type SheetPayload = SheetLeadPayload | SheetOrderPayload

export function orderToSheetPayload(order: Order): SheetOrderPayload {
  return {
    type: 'order',
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    preferredTime: order.preferredTime,
    note: order.note,
    itemSummary: summarizeOrderItems(order.items),
    subtotal: order.subtotal,
    status: order.status,
    timestamp: order.timestamp,
  }
}

/**
 * Send a payload to a Google Apps Script Web App endpoint.
 *
 * Apps Script web apps don't return CORS headers, so we POST with
 * `mode: 'no-cors'` and a `text/plain` body (which avoids a CORS preflight).
 * The row is appended on the Sheet side; the response is opaque, so the local
 * winners/orders lists stay as the source of truth/backup.
 */
export async function submitPayloadToSheet(url: string, payload: SheetPayload): Promise<boolean> {
  if (!url) return false
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    return true
  } catch {
    // Network/endpoint error — local data is still saved and exportable as CSV.
    return false
  }
}

export async function submitLeadToSheet(url: string, lead: Omit<SheetLeadPayload, 'type'>): Promise<boolean> {
  return submitPayloadToSheet(url, { type: 'lead', ...lead })
}

export async function submitOrderToSheet(url: string, order: Order): Promise<boolean> {
  return submitPayloadToSheet(url, orderToSheetPayload(order))
}
