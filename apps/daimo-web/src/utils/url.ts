export type UrlSearchParam = string | string[] | undefined;
export type UrlSearchParams = { [key: string]: UrlSearchParam };

export function getQueryParam(param: UrlSearchParam): string {
  const raw = Array.isArray(param) ? param[0] : param;
  return decodeURIComponent(raw || "");
}
