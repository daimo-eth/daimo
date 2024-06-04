import z, { ZodObject, ZodRawShape } from "zod";

/**
 * Gets an environment variable, throwing an error if it's missing or empty.
 * @deprecated use getEnvVars
 */
export function getEnv(name: string): string {
  const value = process.env[name];
  if (value == null || value === "") {
    throw new Error(`[ENV] missing ${name}`);
  }
  return value;
}

// Gets all env vars, throwing a descriptive error if any are missing or wrong.
export function getEnvVars<T extends ZodRawShape>(
  obj: ZodObject<T>,
): z.infer<ZodObject<T>> {
  return obj.parse(process.env);
}
