import { NamedAccount, zAddress } from "@daimo/api";
import { useEffect } from "react";
import branch from "react-native-branch";
import { z } from "zod";

import { formatDollars } from "./format";
import { getRecipient } from "./recipient";
import { useNav } from "../view/shared/nav";

const branchLink = "http://dai.app.link/wWzhueo2LAb";

// TODO: update Branch link to point to TestFlight
// TODO: remove Branch, use our own domain to avoid Notes risk
// Generates an plain https .app.link
// - If recipient has Daimo, link opens in Daimo
// - If not, they're redirected to the app store
export function getDeferredDeepLink(path: string) {
  return branchLink + path;
}

/** Gets a request-payment link */
export async function getReqLink(
  reqID: string,
  requester: NamedAccount,
  amount: bigint
) {
  const amountStr = formatDollars(amount);
  const { name, addr } = requester;
  const type = "req";

  const buo = await branch.createBranchUniversalObject(`${type}/${reqID}`, {
    title: "Request",
    contentDescription: `${name} is requesting ${amountStr}`,
    contentMetadata: {
      customMetadata: { type, addr, amount: amount.toString() },
    },
  });

  return buo;
}

// TODO: redeem-note link
const zLinkReqPayment = z.object({
  type: z.literal("req"),
  addr: zAddress,
  amount: z.string().regex(/^\d+$/),
});

export function useIncomingDeepLinks() {
  const nav = useNav();

  useEffect(
    () =>
      branch.subscribe({
        onOpenStart: ({ uri, cachedInitialEvent }) => {
          console.log(`[LINK] onOpenStart: ${uri} ${cachedInitialEvent}`);
        },
        onOpenComplete: async ({ error, params, uri }) => {
          if (error) {
            console.log(`[LINK] onOnpenComplete error: ${uri} ${error}`);
            return;
          }

          console.log(
            `[LINK] onOnpenComplete: ${uri} ${JSON.stringify(params)}`
          );
          if (!params) return;

          // TODO: nav to receive page
          const type = params["$type"] as string;
          switch (type) {
            case "req":
              {
                const addr = params["$addr"] as string;
                const amount = params["$amount"] as string;
                const link = zLinkReqPayment.parse({ type, addr, amount });

                console.warn(`[LINK] handling req ${JSON.stringify(link)}`);

                const recipient = await getRecipient(link.addr);

                nav.navigate("Send", {
                  recipient,
                  amount: BigInt(link.amount),
                });
              }
              break;

            default:
              console.warn(`[LINK] unknown type ${type}`);
          }
        },
      }),
    []
  );
}
