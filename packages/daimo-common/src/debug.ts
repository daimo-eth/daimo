// Return compact JSON, 1000 chars max. Never throws.
export function debugJson(obj: any) {
  try {
    return JSON.stringify(obj).slice(0, 1000);
  } catch (e: any) {
    return `<JSON error: ${e.message}>`;
  }
}
