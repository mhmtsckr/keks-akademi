/** JSON gövdeli istek. Gövde metin verilirse olduğu gibi gönderilir (bozuk JSON testleri için). */
export function jsonRequest(
  url: string,
  govde: unknown,
  opts: { method?: string; headers?: Record<string, string> } = {},
) {
  return new Request(url, {
    method: opts.method ?? 'POST',
    headers: { 'content-type': 'application/json', ...opts.headers },
    body: typeof govde === 'string' ? govde : JSON.stringify(govde),
  });
}

/** PayTR callback'inin kullandığı form-encoded gövde. */
export function formRequest(url: string, alanlar: Record<string, string>) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(alanlar).toString(),
  });
}
