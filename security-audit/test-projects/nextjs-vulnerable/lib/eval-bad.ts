// Intentionally vulnerable for fixture testing — DO NOT use in production
export function runUserCode(code: string) {
  return eval(code);
}

export function buildHandler(body: string) {
  return new Function('req', 'res', body);
}
