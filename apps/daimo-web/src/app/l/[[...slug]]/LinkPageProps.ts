import { daimoLinkBaseV2 } from "@daimo/common";

export type LinkPageProps = {
  params: { slug?: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

/// Reconstructs deeplink absolute URL from route params
export function getUrl(props: LinkPageProps): string {
  const path = (props.params.slug || []).join("/");
  const queryString = new URLSearchParams(
    props.searchParams as Record<string, string>
  ).toString();
  return `${daimoLinkBaseV2}/${path}?${queryString}`;
}
