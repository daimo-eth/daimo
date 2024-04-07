import { EAccount, assert } from "@daimo/common";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAddress } from "viem";

import { TextH1, TextLight } from "../../../../components/typography";
import { getAbsoluteUrl } from "../../../../utils/getAbsoluteUrl";
import { rpc } from "../../../../utils/rpc";
import { getFrameMetadata } from "../../frameUtils";

interface LinkProps {
  params: { addr: string };
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  // Load the user we're showing
  let eAcc: EAccount | null = null;
  try {
    const addr = getAddress(props.params.addr);
    eAcc = await rpc.getEthereumAccount.query({ addr });
    assert(eAcc.name != null, `Not a Daimo account: ${addr}`);
  } catch (e) {
    console.warn(`[FRAME] error loading user ${props.params.addr}: ${e}`);
    return notFound();
  }

  // Show image, button text customized to this invite frame
  const frameImg = getAbsoluteUrl(
    `/frame/invite/${eAcc.addr}/preview?name=${eAcc.name}`
  );
  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: `✳️ Get Daimo ✳️`,
      },
    ],
    image: frameImg,
    post_url: getAbsoluteUrl(`/frame/invite/${eAcc.addr}/callback`),
  });

  const metadata: Metadata = {
    title: "Daimo Invite Frame",
    description: "Fast payments, self custody, open source, one-tap invites.",
    openGraph: {
      title: "Daimo Invite Frame",
      description: "Fast payments, self custody, one-tap invites.",
      images: [frameImg],
    },
    other: {
      ...frameMetadata,
    },
  };

  return metadata;
}

export default async function Page({ params }: LinkProps) {
  const addr = getAddress(params.addr);
  const eAcc = await rpc.getEthereumAccount.query({ addr });

  return (
    <div className="p-4 max-w-md">
      <TextH1>✳️ Daimo Invite Frame</TextH1>
      <div className="h-4" />
      <TextLight>
        This is a personalized frame invite from {eAcc.name} on Daimo. Post to
        Farcaster to invite people to join. They&apos;ll get a starter $10 USDC.
      </TextLight>
    </div>
  );
}
