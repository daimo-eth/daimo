import z, { ZodObject, ZodRawShape } from "zod";

// Gets all env vars, throwing a descriptive error if any are missing or wrong.
export function getEnvVars<T extends ZodRawShape>(
  obj: T,
  envObj?: {
    [K in keyof T]: string | undefined;
  }
): z.infer<ZodObject<T>> {
  const zObj = z.object(obj);
  return zObj.parse(envObj || process.env);
}
