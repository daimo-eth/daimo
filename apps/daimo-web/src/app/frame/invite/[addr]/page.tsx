import { EAccount, assert } from "@daimo/common";
import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getAddress } from "viem";

import { TextH1, TextLight } from "../../../../components/typography";
import { getI18N } from "../../../../i18n";
import { getAbsoluteUrl } from "../../../../utils/getAbsoluteUrl";
import { rpc } from "../../../../utils/rpc";
import { getFrameMetadata } from "../../frameUtils";

interface LinkProps {
  params: { addr: string };
}

export async function generateMetadata(props: LinkProps): Promise<Metadata> {
  const i18n = getI18N(headers().get("accept-language"));

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
        label: i18n.frame.invite.frameMetadata.label(),
      },
    ],
    image: frameImg,
    post_url: getAbsoluteUrl(`/frame/invite/${eAcc.addr}/callback`),
  });

  const metadata: Metadata = {
    title: i18n.frame.invite.metadata.title(),
    description: i18n.frame.invite.metadata.description(),
    openGraph: {
      title: i18n.frame.invite.metadata.openGraph.title(),
      description: i18n.frame.invite.metadata.openGraph.description(),
      images: [frameImg],
    },
    other: {
      ...frameMetadata,
    },
  };

  return metadata;
}

export default async function Page({ params }: LinkProps) {
  const i18n = getI18N(headers().get("accept-language"));
  const addr = getAddress(params.addr);
  const eAcc = await rpc.getEthereumAccount.query({ addr });

  let name = eAcc.name;
  if (name == undefined) {
    name = "undefined";
  }

  const i18 = i18n.frame.invite.html;

  return (
    <div className="p-4 max-w-md">
      <TextH1>{i18.title()}</TextH1>
      <div className="h-4" />
      <TextLight>{i18.body(name)}</TextLight>
    </div>
  );
}
