export interface SheetLeadPayload {
  name: string
  phone: string
  prize: string
  consent: boolean
  timestamp: number
}

/**
 * Send a lead to a Google Apps Script Web App endpoint.
 *
 * Apps Script web apps don't return CORS headers, so we POST with
 * `mode: 'no-cors'` and a `text/plain` body (which avoids a CORS preflight).
 * The row is appended on the Sheet side; the response is opaque, so we can't
 * read it — that's fine: the local winners list is the source of truth/backup.
 */
export async function submitLeadToSheet(url: string, lead: SheetLeadPayload): Promise<boolean> {
  if (!url) return false
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(lead),
    })
    return true
  } catch {
    // Network/endpoint error — the lead is still saved locally and exportable as CSV.
    return false
  }
}
