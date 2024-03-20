// Gets an environment variable, throwing an error if it's missing or empty.
export function getEnv(name: string): string {
  const value = process.env[name];
  if (value == null || value === "") {
    throw new Error(`[ENV] missing ${name}`);
  }
  return value;
}
